import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import {
  Shield, Eye, EyeOff, Lock, ArrowRight, ArrowLeft,
  HelpCircle, Users, CheckCircle2, AlertCircle, X, Mail, Phone,
} from 'lucide-react'
import { validateMasterPassword } from '@/utils/validation'
import { hashPassword } from '@/utils/password'
import { motion, AnimatePresence } from 'framer-motion'
import type { SecurityQuestion, EmergencyContact } from '@/types'

type LoginView = 'login' | 'forgot-select' | 'forgot-question' | 'forgot-contact' | 'reset-success'

export default function Login() {
  const navigate = useNavigate()
  const login = useStore(s => s.login)
  const register = useStore(s => s.register)
  const settings = useStore(s => s.settings)
  const updateSettings = useStore(s => s.updateSettings)

  const isRegistered = !!settings.masterPasswordHash

  const [view, setView] = useState<LoginView>('login')

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const [questionIndex, setQuestionIndex] = useState(0)
  const [questionAnswer, setQuestionAnswer] = useState('')
  const [questionAttempts, setQuestionAttempts] = useState(0)
  const [questionsVerified, setQuestionsVerified] = useState(false)

  const [contactField, setContactField] = useState<'email' | 'phone'>('email')
  const [contactValue, setContactValue] = useState('')
  const [contactVerified, setContactVerified] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  const securityQuestions = settings.securityQuestions || []
  const emergencyContacts = settings.emergencyContacts || []
  const hasQuestions = securityQuestions.length > 0
  const hasContacts = emergencyContacts.length > 0

  const currentQuestion = securityQuestions[questionIndex]

  const resetFlow = () => {
    setView('login')
    setPassword('')
    setShowPassword(false)
    setError('')
    setQuestionIndex(0)
    setQuestionAnswer('')
    setQuestionAttempts(0)
    setQuestionsVerified(false)
    setContactField('email')
    setContactValue('')
    setContactVerified(false)
    setNewPassword('')
    setConfirmNewPassword('')
    setShowNewPassword(false)
    setShowConfirmNewPassword(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateMasterPassword(password)
    if (!validation.valid) {
      setError(validation.message)
      return
    }

    if (isRegistered) {
      const success = login(password)
      if (success) {
        navigate('/vault')
      } else {
        setError('主密码错误，请重试')
      }
    } else {
      register(password)
      navigate('/vault')
    }
  }

  const handleSubmitQuestionAnswer = () => {
    if (!questionAnswer.trim()) {
      setError('请输入安全问题的答案')
      return
    }
    const answerHash = hashPassword(questionAnswer.trim())
    if (answerHash === currentQuestion.answerHash) {
      setQuestionAttempts(0)
      if (questionIndex + 1 >= securityQuestions.length) {
        setQuestionsVerified(true)
        setError('')
      } else {
        setQuestionIndex(prev => prev + 1)
        setQuestionAnswer('')
        setError('')
      }
    } else {
      const newAttempts = questionAttempts + 1
      setQuestionAttempts(newAttempts)
      if (newAttempts >= 3) {
        setError(`答案错误，已尝试 ${newAttempts} 次。请再检查一遍，或尝试其他验证方式。`)
      } else {
        setError(`答案错误，请重试。剩余尝试次数：${3 - newAttempts}`)
      }
    }
  }

  const handleSubmitContactVerify = () => {
    if (!contactValue.trim()) {
      setError(`请输入联系人的${contactField === 'email' ? '邮箱' : '手机号'}`)
      return
    }

    let matched: EmergencyContact | null = null
    if (contactField === 'email') {
      matched = emergencyContacts.find(
        c => c.email && c.email.trim().toLowerCase() === contactValue.trim().toLowerCase()
      ) || null
    } else {
      const normalizedInput = contactValue.replace(/\s/g, '')
      matched = emergencyContacts.find(
        c => c.phone && c.phone.replace(/\s/g, '') === normalizedInput
      ) || null
    }

    if (matched) {
      setContactVerified(true)
      setError('')
    } else {
      setError(
        contactField === 'email'
          ? '该邮箱与保存的紧急联系人信息不匹配，请检查后重试'
          : '该手机号与保存的紧急联系人信息不匹配，请检查后重试'
      )
    }
  }

  const canReset = questionsVerified || contactVerified

  const handleResetPassword = () => {
    const validation = validateMasterPassword(newPassword)
    if (!validation.valid) {
      setError(validation.message)
      return
    }
    if (newPassword !== confirmNewPassword) {
      setError('两次输入的新密码不一致')
      return
    }

    const newHash = hashPassword(newPassword)
    updateSettings({ masterPasswordHash: newHash })
    setView('reset-success')
  }

  const handleBackToLoginAfterReset = () => {
    const saved = login(newPassword)
    if (saved) {
      navigate('/vault')
    } else {
      resetFlow()
    }
  }

  const renderHeader = (title: string, subtitle: string, onClickBack?: () => void) => (
    <div className="mb-6">
      {onClickBack && (
        <button
          onClick={onClickBack}
          className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          返回
        </button>
      )}
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-xl gradient-green flex items-center justify-center mb-3 glow-green">
          <Shield className="w-6 h-6 text-[#0A0E27]" />
        </div>
        <h2 className="font-display font-bold text-xl text-[var(--text-primary)] text-center">{title}</h2>
        <p className="text-[var(--text-muted)] text-sm mt-1 text-center max-w-xs">{subtitle}</p>
      </div>
    </div>
  )

  const renderLogin = () => (
    <div>
      <div className="flex flex-col items-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-2xl gradient-green flex items-center justify-center mb-4 glow-green"
        >
          <Shield className="w-8 h-8 text-[#0A0E27]" />
        </motion.div>
        <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">SafeVault</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">
          {isRegistered ? '输入主密码解锁' : '创建主密码开始使用'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">主密码</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              placeholder={isRegistered ? '请输入主密码' : '设置主密码（至少6位）'}
              className={`input-dark pl-11 pr-11 ${error && view === 'login' ? 'error' : ''}`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && view === 'login' && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[var(--accent-red)] text-xs mt-2">
              {error}
            </motion.p>
          )}
        </div>

        {!isRegistered && password.length >= 6 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card p-3">
            <p className="text-xs text-[var(--text-muted)]">
              ⚠️ 请牢记主密码，建议提前到「设置」中配置安全问题和紧急联系人以便找回。
            </p>
          </motion.div>
        )}

        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
          {isRegistered ? '解锁' : '创建密码库'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {isRegistered && (
        <div className="mt-6 text-center">
          <button
            onClick={() => { setView('forgot-select'); setError('') }}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors"
          >
            忘记主密码？找回密码
          </button>
        </div>
      )}
    </div>
  )

  const renderForgotSelect = () => (
    <div>
      {renderHeader('找回主密码', '选择验证方式以重置主密码', resetFlow)}

      <div className="space-y-3">
        <button
          onClick={() => { setView('forgot-question'); setError('') }}
          disabled={!hasQuestions}
          className={`w-full p-4 rounded-xl border transition-all text-left ${
            hasQuestions
              ? 'glass-card glass-card-hover border-[var(--border-glass)] group'
              : 'bg-white/[0.02] border border-white/[0.05] opacity-60 cursor-not-allowed'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              hasQuestions ? 'bg-[var(--accent-green)]/15 group-hover:bg-[var(--accent-green)]/25' : 'bg-white/5'
            }`}>
              <HelpCircle className={`w-5 h-5 ${hasQuestions ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)]'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-semibold ${hasQuestions ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>安全问题验证</p>
                {hasQuestions && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-green)]/15 text-[var(--accent-green)]">已配置</span>}
                {!hasQuestions && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)]">未配置</span>}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {hasQuestions
                  ? `需正确回答已设置的 ${securityQuestions.length} 个安全问题`
                  : '尚未设置安全问题，无法使用此方式'}
              </p>
            </div>
            {hasQuestions && <ArrowRight className="w-4 h-4 text-[var(--text-muted)] mt-2 shrink-0" />}
          </div>
        </button>

        <button
          onClick={() => { setView('forgot-contact'); setError('') }}
          disabled={!hasContacts}
          className={`w-full p-4 rounded-xl border transition-all text-left ${
            hasContacts
              ? 'glass-card glass-card-hover border-[var(--border-glass)] group'
              : 'bg-white/[0.02] border border-white/[0.05] opacity-60 cursor-not-allowed'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              hasContacts ? 'bg-[var(--accent-blue)]/15 group-hover:bg-[var(--accent-blue)]/25' : 'bg-white/5'
            }`}>
              <Users className={`w-5 h-5 ${hasContacts ? 'text-[var(--accent-blue)]' : 'text-[var(--text-muted)]'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-semibold ${hasContacts ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>紧急联系人验证</p>
                {hasContacts && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)]">{emergencyContacts.length} 位联系人</span>}
                {!hasContacts && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)]">未配置</span>}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {hasContacts
                  ? '通过验证紧急联系人的邮箱或手机号来重置'
                  : '尚未设置紧急联系人，无法使用此方式'}
              </p>
            </div>
            {hasContacts && <ArrowRight className="w-4 h-4 text-[var(--text-muted)] mt-2 shrink-0" />}
          </div>
        </button>

        {!hasQuestions && !hasContacts && (
          <div className="mt-3 p-4 rounded-xl bg-[var(--accent-yellow)]/10 border border-[var(--accent-yellow)]/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[var(--accent-yellow)] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[var(--accent-yellow)] mb-1">未配置找回方式</p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  您尚未设置安全问题和紧急联系人，无法通过验证方式找回主密码。
                  如果实在忘记了主密码，只能重新创建密码库（会清空当前所有数据）。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderForgotQuestion = () => {
    if (!currentQuestion) return null

    return (
      <div>
        {renderHeader(
          '安全问题验证',
          questionsVerified
            ? '验证通过，请设置新的主密码'
            : `第 ${questionIndex + 1} / ${securityQuestions.length} 个安全问题`,
          () => { setView('forgot-select'); setQuestionAttempts(0); setError('') }
        )}

        <AnimatePresence mode="wait">
          {!questionsVerified ? (
            <motion.div
              key="q"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="glass-card p-4">
                <p className="text-xs text-[var(--text-muted)] mb-1">问题</p>
                <p className="text-[var(--text-primary)] font-medium">{currentQuestion.question}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">您的答案</label>
                <input
                  type="text"
                  value={questionAnswer}
                  onChange={(e) => { setQuestionAnswer(e.target.value); setError('') }}
                  placeholder="请输入该问题的答案（注意大小写）"
                  className={`input-dark ${error ? 'error' : ''}`}
                  autoFocus
                />
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[var(--accent-red)] text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {error}
                </motion.p>
              )}

              <button
                onClick={handleSubmitQuestionAnswer}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                确认答案
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <ResetPasswordForm
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmNewPassword={confirmNewPassword}
              setConfirmNewPassword={setConfirmNewPassword}
              showNewPassword={showNewPassword}
              setShowNewPassword={setShowNewPassword}
              showConfirmNewPassword={showConfirmNewPassword}
              setShowConfirmNewPassword={setShowConfirmNewPassword}
              error={error}
              setError={setError}
              onSubmit={handleResetPassword}
              canSubmit={canReset}
            />
          )}
        </AnimatePresence>
      </div>
    )
  }

  const renderForgotContact = () => (
    <div>
      {renderHeader(
        '紧急联系人验证',
        contactVerified
          ? '验证通过，请设置新的主密码'
          : '输入紧急联系人的信息以完成验证',
        () => { setView('forgot-select'); setError('') }
      )}

      <AnimatePresence mode="wait">
        {!contactVerified ? (
          <motion.div
            key="c"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex gap-2 p-1 glass-card">
              {[
                { key: 'email', label: '邮箱', icon: Mail },
                { key: 'phone', label: '手机号', icon: Phone },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { setContactField(opt.key as 'email' | 'phone'); setContactValue(''); setError('') }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    contactField === opt.key
                      ? 'gradient-green text-[#0A0E27]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="glass-card p-4">
              <p className="text-xs text-[var(--text-muted)] mb-2">已保存的紧急联系人（已脱敏）</p>
              <div className="space-y-2">
                {emergencyContacts.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-pink)]/15 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-[var(--accent-pink)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{c.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {contactField === 'email'
                          ? (c.email ? maskEmail(c.email) : '未设置邮箱')
                          : (c.phone ? maskPhone(c.phone) : '未设置手机号')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {contactField === 'email' ? '联系人邮箱' : '联系人手机号'}
              </label>
              <div className="relative">
                {contactField === 'email'
                  ? <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  : <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                }
                <input
                  type={contactField === 'email' ? 'email' : 'tel'}
                  value={contactValue}
                  onChange={(e) => { setContactValue(e.target.value); setError('') }}
                  placeholder={contactField === 'email' ? '请输入联系人邮箱地址' : '请输入联系人手机号'}
                  className={`input-dark pl-11 ${error ? 'error' : ''}`}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[var(--accent-red)] text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </motion.p>
            )}

            <button
              onClick={handleSubmitContactVerify}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              验证信息
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <ResetPasswordForm
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmNewPassword={confirmNewPassword}
            setConfirmNewPassword={setConfirmNewPassword}
            showNewPassword={showNewPassword}
            setShowNewPassword={setShowNewPassword}
            showConfirmNewPassword={showConfirmNewPassword}
            setShowConfirmNewPassword={setShowConfirmNewPassword}
            error={error}
            setError={setError}
            onSubmit={handleResetPassword}
            canSubmit={canReset}
          />
        )}
      </AnimatePresence>
    </div>
  )

  const renderResetSuccess = () => (
    <div>
      <div className="flex flex-col items-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-2xl gradient-green flex items-center justify-center mb-4 glow-green"
        >
          <CheckCircle2 className="w-8 h-8 text-[#0A0E27]" />
        </motion.div>
        <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">密码重置成功</h2>
        <p className="text-[var(--text-muted)] text-sm mt-1 text-center max-w-xs">
          主密码已更新，现在可以用新密码登录密码库
        </p>
      </div>

      <div className="glass-card p-4 mb-5">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-[var(--accent-green)] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">安全提醒</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
              请妥善保管好您的新主密码。建议您到设置中重新检查安全问题和紧急联系人是否需要更新。
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleBackToLoginAfterReset}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        使用新密码进入密码库
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] bg-grid relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[var(--accent-green)]/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[var(--accent-blue)]/5 blur-3xl" />
      </div>

      <motion.div
        key={view}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-md px-6 py-8"
      >
        <div className="glass-card p-6 md:p-8">
          {view === 'login' && renderLogin()}
          {view === 'forgot-select' && renderForgotSelect()}
          {view === 'forgot-question' && renderForgotQuestion()}
          {view === 'forgot-contact' && renderForgotContact()}
          {view === 'reset-success' && renderResetSuccess()}
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          所有数据均加密存储在本地，不会上传至任何服务器
        </p>
      </motion.div>
    </div>
  )
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  if (!name || !domain) return email
  if (name.length <= 2) return '•••@' + domain
  return name.charAt(0) + '•••' + name.charAt(name.length - 1) + '@' + domain
}

function maskPhone(phone: string) {
  const cleaned = phone.replace(/\s/g, '')
  if (cleaned.length < 7) return phone.replace(/./g, '•')
  return cleaned.slice(0, 3) + '••••' + cleaned.slice(-4)
}

interface ResetFormProps {
  newPassword: string
  setNewPassword: (v: string) => void
  confirmNewPassword: string
  setConfirmNewPassword: (v: string) => void
  showNewPassword: boolean
  setShowNewPassword: (v: boolean) => void
  showConfirmNewPassword: boolean
  setShowConfirmNewPassword: (v: boolean) => void
  error: string
  setError: (v: string) => void
  onSubmit: () => void
  canSubmit: boolean
}

function ResetPasswordForm(props: ResetFormProps) {
  const {
    newPassword, setNewPassword, confirmNewPassword, setConfirmNewPassword,
    showNewPassword, setShowNewPassword, showConfirmNewPassword, setShowConfirmNewPassword,
    error, setError, onSubmit, canSubmit,
  } = props

  return (
    <motion.div
      key="reset"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="p-3 rounded-xl bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30 flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-[var(--accent-green)] mt-0.5 shrink-0" />
        <p className="text-xs text-[var(--accent-green)]">
          身份验证已通过，请设置新的主密码。建议使用强度「强」以上的密码。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">新主密码</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError('') }}
            placeholder="设置新主密码（至少6位）"
            className={`input-dark pl-11 pr-11 ${error ? 'error' : ''}`}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">确认新主密码</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type={showConfirmNewPassword ? 'text' : 'password'}
            value={confirmNewPassword}
            onChange={(e) => { setConfirmNewPassword(e.target.value); setError('') }}
            placeholder="请再次输入新主密码"
            className={`input-dark pl-11 pr-11 ${error ? 'error' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[var(--accent-red)] text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </motion.p>
      )}

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
      >
        确认重置密码
        <CheckCircle2 className="w-4 h-4" />
      </button>
    </motion.div>
  )
}
