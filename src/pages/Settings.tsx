import { useState } from 'react'
import { useStore } from '@/store'
import { hashPassword } from '@/utils/password'
import { evaluatePasswordStrength } from '@/utils/password'
import { validateEmail, validatePhone, validateSecurityAnswer, validateMasterPassword } from '@/utils/validation'
import type { SecurityQuestion, EmergencyContact } from '@/types'
import { motion } from 'framer-motion'
import {
  Lock, Shield, Users, Bell, Eye, EyeOff, Plus, Trash2, Edit2, Save, X, Check, Phone, Mail, User,
} from 'lucide-react'

const PRESET_QUESTIONS = [
  '您的出生城市？',
  '您的第一所学校？',
  '您母亲的姓名？',
  '您宠物的名字？',
  '您最喜欢的电影？',
  '您的毕业学校？',
]

const RELATION_OPTIONS = ['家人', '朋友', '同事', '其他']

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
}

export default function Settings() {
  const settings = useStore(s => s.settings)
  const updateSettings = useStore(s => s.updateSettings)
  const verifyMasterPassword = useStore(s => s.verifyMasterPassword)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null)
  const [questionForm, setQuestionForm] = useState({ question: '', answer: '' })
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({})

  const [showContactForm, setShowContactForm] = useState(false)
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null)
  const [contactForm, setContactForm] = useState<EmergencyContact>({ name: '', email: '', phone: '', relation: '家人' })
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({})

  const handleChangePassword = () => {
    setPasswordError('')
    setPasswordSuccess(false)

    if (!currentPassword) {
      setPasswordError('请输入当前密码')
      return
    }
    if (!verifyMasterPassword(currentPassword)) {
      setPasswordError('当前密码错误')
      return
    }

    const validation = validateMasterPassword(newPassword)
    if (!validation.valid) {
      setPasswordError(validation.message)
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不一致')
      return
    }

    const newHash = hashPassword(newPassword)
    updateSettings({ masterPasswordHash: newHash })
    setPasswordSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPasswordSuccess(false), 3000)
  }

  const handleAddQuestion = () => {
    const answerValidation = validateSecurityAnswer(questionForm.answer)
    if (!questionForm.question) {
      return
    }
    if (!answerValidation.valid) {
      return
    }
    const answerHash = hashPassword(questionForm.answer)
    const newQuestions = [...settings.securityQuestions]
    if (editingQuestionIndex !== null) {
      newQuestions[editingQuestionIndex] = { question: questionForm.question, answerHash }
    } else {
      if (newQuestions.length >= 3) return
      newQuestions.push({ question: questionForm.question, answerHash })
    }
    updateSettings({ securityQuestions: newQuestions })
    setEditingQuestionIndex(null)
    setQuestionForm({ question: '', answer: '' })
  }

  const handleDeleteQuestion = (index: number) => {
    const newQuestions = settings.securityQuestions.filter((_, i) => i !== index)
    updateSettings({ securityQuestions: newQuestions })
  }

  const handleStartEditQuestion = (index: number) => {
    setEditingQuestionIndex(index)
    setQuestionForm({ question: settings.securityQuestions[index].question, answer: '' })
  }

  const handleSaveContact = () => {
    const errors: Record<string, string> = {}
    if (!contactForm.name.trim()) errors.name = '请输入联系人姓名'
    if (contactForm.email) {
      const emailResult = validateEmail(contactForm.email)
      if (!emailResult.valid) errors.email = emailResult.message
    }
    if (contactForm.phone) {
      const phoneResult = validatePhone(contactForm.phone)
      if (!phoneResult.valid) errors.phone = phoneResult.message
    }
    if (!contactForm.email && !contactForm.phone) {
      errors.email = '请至少填写邮箱或手机号'
    }

    setContactErrors(errors)
    if (Object.keys(errors).length > 0) return

    const newContacts = [...settings.emergencyContacts]
    if (editingContactIndex !== null) {
      newContacts[editingContactIndex] = contactForm
    } else {
      newContacts.push(contactForm)
    }
    updateSettings({ emergencyContacts: newContacts })
    setShowContactForm(false)
    setEditingContactIndex(null)
    setContactForm({ name: '', email: '', phone: '', relation: '家人' })
    setContactErrors({})
  }

  const handleDeleteContact = (index: number) => {
    const newContacts = settings.emergencyContacts.filter((_, i) => i !== index)
    updateSettings({ emergencyContacts: newContacts })
  }

  const handleStartEditContact = (index: number) => {
    setEditingContactIndex(index)
    setContactForm(settings.emergencyContacts[index])
    setShowContactForm(true)
    setContactErrors({})
  }

  const handleCancelContactForm = () => {
    setShowContactForm(false)
    setEditingContactIndex(null)
    setContactForm({ name: '', email: '', phone: '', relation: '家人' })
    setContactErrors({})
  }

  const newPasswordStrength = newPassword ? evaluatePasswordStrength(newPassword) : null

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-display font-bold text-xl text-[var(--text-primary)]">设置</h1>
      </div>

      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-[var(--accent-green)]" />
          <h2 className="font-display font-semibold text-[var(--text-primary)] text-lg">主密码管理</h2>
        </div>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">当前密码</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => { setCurrentPassword(e.target.value); setPasswordError('') }}
                className="input-dark pr-10"
                placeholder="请输入当前主密码"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">新密码</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setPasswordError('') }}
                className="input-dark pr-10"
                placeholder="请输入新密码"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPasswordStrength && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 strength-bar-${newPasswordStrength.level}`}
                      style={{ width: `${newPasswordStrength.score}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{newPasswordStrength.score}分</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setPasswordError('') }}
              className="input-dark"
              placeholder="请再次输入新密码"
            />
          </div>

          {passwordError && (
            <p className="text-[var(--accent-red)] text-sm">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-[var(--accent-green)] text-sm flex items-center gap-1">
              <Check className="w-4 h-4" /> 主密码已成功修改
            </p>
          )}

          <button onClick={handleChangePassword} className="btn-primary text-sm flex items-center gap-2">
            <Save className="w-4 h-4" />
            修改主密码
          </button>
        </div>
      </motion.div>

      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--accent-yellow)]" />
            <h2 className="font-display font-semibold text-[var(--text-primary)] text-lg">安全问题</h2>
          </div>
          {settings.securityQuestions.length < 3 && editingQuestionIndex === null && (
            <button
              onClick={() => { setEditingQuestionIndex(null); setQuestionForm({ question: PRESET_QUESTIONS[0], answer: '' }) }}
              className="btn-secondary text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              添加
            </button>
          )}
        </div>

        <div className="space-y-3 max-w-lg">
          {settings.securityQuestions.map((q, index) => (
            <div key={index} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-primary)]">{q.question}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAnswers(prev => ({ ...prev, [index]: !prev[index] }))}
                    className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {showAnswers[index] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleStartEditQuestion(index)}
                    className="text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(index)}
                    className="text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {showAnswers[index] ? '••••••' : '••••••'}
              </p>
            </div>
          ))}

          {editingQuestionIndex !== null || (settings.securityQuestions.length < 3 && questionForm.question) ? (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] space-y-3">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">选择问题</label>
                <select
                  value={questionForm.question}
                  onChange={e => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                  className="input-dark"
                >
                  {PRESET_QUESTIONS.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">答案</label>
                <input
                  type="text"
                  value={questionForm.answer}
                  onChange={e => setQuestionForm(prev => ({ ...prev, answer: e.target.value }))}
                  className="input-dark"
                  placeholder="请输入安全问题答案"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddQuestion} className="btn-primary text-xs flex items-center gap-1">
                  <Save className="w-3.5 h-3.5" />
                  保存
                </button>
                <button
                  onClick={() => { setEditingQuestionIndex(null); setQuestionForm({ question: '', answer: '' }) }}
                  className="btn-secondary text-xs flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  取消
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>

      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--accent-pink)]" />
            <h2 className="font-display font-semibold text-[var(--text-primary)] text-lg">紧急联系人</h2>
          </div>
          {!showContactForm && (
            <button
              onClick={() => { setShowContactForm(true); setEditingContactIndex(null); setContactForm({ name: '', email: '', phone: '', relation: '家人' }) }}
              className="btn-secondary text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              添加
            </button>
          )}
        </div>

        <div className="space-y-3 max-w-lg">
          {settings.emergencyContacts.map((contact, index) => (
            <div key={index} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-pink)]/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-[var(--accent-pink)]" />
                  </div>
                  <div>
                    <span className="text-sm text-[var(--text-primary)]">{contact.name}</span>
                    <span className="text-xs text-[var(--text-muted)] ml-2">{contact.relation}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEditContact(index)}
                    className="text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteContact(index)}
                    className="text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 ml-11">
                {contact.email && (
                  <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Mail className="w-3 h-3" />
                    {contact.email}
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Phone className="w-3 h-3" />
                    {contact.phone}
                  </div>
                )}
              </div>
            </div>
          ))}

          {showContactForm && (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] space-y-3">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">姓名</label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={e => { setContactForm(prev => ({ ...prev, name: e.target.value })); setContactErrors(prev => ({ ...prev, name: '' })) }}
                  className={`input-dark ${contactErrors.name ? 'error' : ''}`}
                  placeholder="请输入联系人姓名"
                />
                {contactErrors.name && <p className="text-[var(--accent-red)] text-xs mt-1">{contactErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">邮箱</label>
                <input
                  type="text"
                  value={contactForm.email}
                  onChange={e => { setContactForm(prev => ({ ...prev, email: e.target.value })); setContactErrors(prev => ({ ...prev, email: '' })) }}
                  className={`input-dark ${contactErrors.email ? 'error' : ''}`}
                  placeholder="请输入邮箱地址"
                />
                {contactErrors.email && <p className="text-[var(--accent-red)] text-xs mt-1">{contactErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">手机号</label>
                <input
                  type="text"
                  value={contactForm.phone}
                  onChange={e => { setContactForm(prev => ({ ...prev, phone: e.target.value })); setContactErrors(prev => ({ ...prev, phone: '' })) }}
                  className={`input-dark ${contactErrors.phone ? 'error' : ''}`}
                  placeholder="请输入手机号码"
                />
                {contactErrors.phone && <p className="text-[var(--accent-red)] text-xs mt-1">{contactErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">关系</label>
                <select
                  value={contactForm.relation}
                  onChange={e => setContactForm(prev => ({ ...prev, relation: e.target.value }))}
                  className="input-dark"
                >
                  {RELATION_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveContact} className="btn-primary text-xs flex items-center gap-1">
                  <Save className="w-3.5 h-3.5" />
                  保存
                </button>
                <button onClick={handleCancelContactForm} className="btn-secondary text-xs flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-[var(--accent-blue)]" />
          <h2 className="font-display font-semibold text-[var(--text-primary)] text-lg">通知偏好</h2>
        </div>

        <div className="space-y-4 max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-primary)]">泄露预警通知</p>
              <p className="text-xs text-[var(--text-muted)]">当检测到密码泄露时发送通知</p>
            </div>
            <div
              className={`toggle-switch ${settings.notifications.breachAlert ? 'active' : ''}`}
              onClick={() => updateSettings({
                notifications: { ...settings.notifications, breachAlert: !settings.notifications.breachAlert },
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-primary)]">密码更新提醒</p>
              <p className="text-xs text-[var(--text-muted)]">在密码即将过期时发送提醒</p>
            </div>
            <div
              className={`toggle-switch ${settings.notifications.updateReminder ? 'active' : ''}`}
              onClick={() => updateSettings({
                notifications: { ...settings.notifications, updateReminder: !settings.notifications.updateReminder },
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-primary)]">提前几天提醒</p>
              <p className="text-xs text-[var(--text-muted)]">密码过期前提前提醒天数</p>
            </div>
            <input
              type="number"
              min={1}
              max={30}
              value={settings.notifications.reminderDaysBefore}
              onChange={e => {
                const val = Math.min(30, Math.max(1, parseInt(e.target.value) || 1))
                updateSettings({
                  notifications: { ...settings.notifications, reminderDaysBefore: val },
                })
              }}
              className="input-dark w-20 text-center"
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
