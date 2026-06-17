import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@/store'
import { evaluatePasswordStrength, generatePassword, checkBreach } from '@/utils/password'
import { validateWebsite, validateUrl, validateUsername, validatePassword } from '@/utils/validation'
import type { PasswordEntry, StrengthLevel, Category } from '@/types'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Save, Zap, RefreshCw, Eye, EyeOff, Globe, User, Lock, FileText,
  ChevronDown, Check, AlertTriangle, ShieldAlert, Lightbulb, Landmark, Users,
  Briefcase, ShoppingCart, Gamepad2, Folder, X, Copy,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Landmark, Users, Briefcase, ShoppingCart, Gamepad2, Folder,
}

const STRENGTH_LABEL: Record<StrengthLevel, string> = {
  weak: '弱',
  medium: '中',
  strong: '强',
  'very-strong': '极强',
}

const STRENGTH_BAR: Record<StrengthLevel, string> = {
  weak: 'strength-bar-weak',
  medium: 'strength-bar-medium',
  strong: 'strength-bar-strong',
  'very-strong': 'strength-bar-very-strong',
}

const STRENGTH_TEXT_COLOR: Record<StrengthLevel, string> = {
  weak: 'text-[var(--accent-red)]',
  medium: 'text-[var(--accent-yellow)]',
  strong: 'text-[var(--accent-green)]',
  'very-strong': 'text-cyan-400',
}

export default function PasswordManager() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const entries = useStore(s => s.entries)
  const categories = useStore(s => s.categories)
  const addEntry = useStore(s => s.addEntry)
  const updateEntry = useStore(s => s.updateEntry)

  const isEdit = !!id
  const existingEntry = id ? entries.find(e => e.id === id) : null

  const [website, setWebsite] = useState(existingEntry?.website || '')
  const [url, setUrl] = useState(existingEntry?.url || '')
  const [username, setUsername] = useState(existingEntry?.username || '')
  const [password, setPassword] = useState(existingEntry?.password || '')
  const [category, setCategory] = useState(existingEntry?.category || 'cat-other')
  const [notes, setNotes] = useState(existingEntry?.notes || '')

  const [showPassword, setShowPassword] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [categoryDropdown, setCategoryDropdown] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [breachCheckResult, setBreachCheckResult] = useState<{ checked: boolean; isBreached: boolean; info?: { source: string; breachDate: string; description: string } }>({
    checked: false,
    isBreached: false,
  })
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [genLength, setGenLength] = useState(16)
  const [genUpper, setGenUpper] = useState(true)
  const [genLower, setGenLower] = useState(true)
  const [genNumbers, setGenNumbers] = useState(true)
  const [genSymbols, setGenSymbols] = useState(true)
  const [genCopied, setGenCopied] = useState(false)

  useEffect(() => {
    if (url) {
      const result = checkBreach(url)
      setBreachCheckResult({
        checked: true,
        isBreached: result.isBreached,
        info: result.breachInfo,
      })
    } else {
      setBreachCheckResult({ checked: false, isBreached: false })
    }
  }, [url])

  const strength = useMemo(() => evaluatePasswordStrength(password), [password])

  const getCategoryById = (catId: string): Category | undefined => categories.find(c => c.id === catId)

  const handleGenerate = () => {
    if (!genUpper && !genLower && !genNumbers && !genSymbols) return
    const pwd = generatePassword({
      length: genLength,
      uppercase: genUpper,
      lowercase: genLower,
      numbers: genNumbers,
      symbols: genSymbols,
    })
    setPassword(pwd)
    setShowSuggestions(false)
  }

  const handleUseGenerated = () => {
    handleGenerate()
    setShowGenerator(false)
  }

  const handleCopyGenerated = async () => {
    if (!password) return
    await navigator.clipboard.writeText(password)
    setGenCopied(true)
    setTimeout(() => setGenCopied(false), 2000)
  }

  const showWeakWarning = password && strength.score < 60

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    const websiteResult = validateWebsite(website)
    if (!websiteResult.valid) newErrors.website = websiteResult.message
    const urlResult = validateUrl(url)
    if (!urlResult.valid) newErrors.url = urlResult.message
    const usernameResult = validateUsername(username)
    if (!usernameResult.valid) newErrors.username = usernameResult.message
    const passwordResult = validatePassword(password)
    if (!passwordResult.valid) newErrors.password = passwordResult.message

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    if (isEdit && existingEntry) {
      updateEntry(existingEntry.id, {
        website,
        url,
        username,
        password,
        category,
        notes,
        strength: strength.level,
        strengthScore: strength.score,
        isBreached: breachCheckResult.isBreached,
        breachInfo: breachCheckResult.info,
      })
    } else {
      addEntry({
        website,
        url,
        username,
        password,
        category,
        notes,
        strength: strength.level,
        strengthScore: strength.score,
        isBreached: breachCheckResult.isBreached,
        breachInfo: breachCheckResult.info,
      })
    }
    navigate('/vault')
  }

  const selectedCategory = getCategoryById(category)

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/vault')}
          className="p-2 rounded-xl glass-card text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">
            {isEdit ? '编辑账号' : '添加账号'}
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            {isEdit ? '更新账号信息和密码' : '添加新的网站或应用账号'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                网站 / 应用名称 <span className="text-[var(--accent-red)]">*</span>
              </label>
              <input
                type="text"
                value={website}
                onChange={e => { setWebsite(e.target.value); setErrors(p => ({ ...p, website: '' })) }}
                placeholder="例如: GitHub, 微信, 支付宝"
                className={`input-dark ${errors.website ? 'error' : ''}`}
              />
              {errors.website && (
                <p className="text-[var(--accent-red)] text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {errors.website}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                网址 URL
              </label>
              <input
                type="text"
                value={url}
                onChange={e => { setUrl(e.target.value); setErrors(p => ({ ...p, url: '' })) }}
                placeholder="例如: https://github.com"
                className={`input-dark ${errors.url ? 'error' : ''}`}
              />
              {errors.url && (
                <p className="text-[var(--accent-red)] text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {errors.url}
                </p>
              )}
              {breachCheckResult.checked && breachCheckResult.isBreached && breachCheckResult.info && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-3 rounded-xl bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30"
                >
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-[var(--accent-red)] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-[var(--accent-red)]">检测到该网站曾发生数据泄露</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        来源: {breachCheckResult.info.source} · 日期: {breachCheckResult.info.breachDate}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{breachCheckResult.info.description}</p>
                      <p className="text-xs text-[var(--accent-yellow)] mt-1">⚠️ 建议立即修改此账号密码</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                <User className="w-4 h-4 inline mr-2" />
                用户名 / 账号 <span className="text-[var(--accent-red)]">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: '' })) }}
                placeholder="输入用户名、邮箱或手机号"
                className={`input-dark ${errors.username ? 'error' : ''}`}
              />
              {errors.username && (
                <p className="text-[var(--accent-red)] text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {errors.username}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  <Lock className="w-4 h-4 inline mr-2" />
                  密码 <span className="text-[var(--accent-red)]">*</span>
                </label>
                <button
                  onClick={() => setShowGenerator(!showGenerator)}
                  className="text-xs text-[var(--accent-green)] hover:text-[var(--accent-green-light)] font-medium flex items-center gap-1 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  使用生成器
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); if (showWeakWarning) setShowSuggestions(true) }}
                  placeholder="输入或生成密码"
                  className={`input-dark pr-20 ${errors.password ? 'error' : ''} font-mono tracking-wider`}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors"
                    title="一键生成"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="text-[var(--accent-red)] text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {errors.password}
                </p>
              )}

              {password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-muted)]">密码强度:</span>
                      <span className={`text-xs font-semibold ${STRENGTH_TEXT_COLOR[strength.level]}`}>
                        {STRENGTH_LABEL[strength.level]} · {strength.score}分
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${strength.score}%` }}
                      transition={{ duration: 0.4 }}
                      className={`h-full rounded-full ${STRENGTH_BAR[strength.level]}`}
                    />
                  </div>
                </div>
              )}

              {showWeakWarning && showSuggestions && strength.suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 rounded-xl bg-[var(--accent-yellow)]/10 border border-[var(--accent-yellow)]/30"
                >
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-[var(--accent-yellow)] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-[var(--accent-yellow)] mb-1">密码强度不足，建议改进:</p>
                      <ul className="space-y-0.5">
                        {strength.suggestions.map((s, i) => (
                          <li key={i} className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-[var(--accent-yellow)]" />
                            {s}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={handleUseGenerated}
                        className="mt-2 text-xs text-[var(--accent-green)] hover:text-[var(--accent-green-light)] font-medium flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        一键生成强密码
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                分类
              </label>
              <div className="relative">
                <button
                  onClick={() => setCategoryDropdown(!categoryDropdown)}
                  className="input-dark flex items-center justify-between text-left"
                >
                  {selectedCategory ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${selectedCategory.color}20` }}
                      >
                        {ICON_MAP[selectedCategory.icon] && (() => {
                          const Icon = ICON_MAP[selectedCategory.icon]
                          return <Icon className="w-3.5 h-3.5" style={{ color: selectedCategory.color }} />
                        })()}
                      </span>
                      <span className="text-sm text-[var(--text-primary)]">{selectedCategory.name}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-[var(--text-muted)]">选择分类</span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${categoryDropdown ? 'rotate-180' : ''}`} />
                </button>
                {categoryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-2 w-full glass-card p-2 z-20 max-h-64 overflow-y-auto"
                  >
                    {categories.map(cat => {
                      const Icon = ICON_MAP[cat.icon]
                      return (
                        <button
                          key={cat.id}
                          onClick={() => { setCategory(cat.id); setCategoryDropdown(false) }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                            category === cat.id
                              ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]'
                              : 'text-[var(--text-secondary)] hover:bg-white/5'
                          }`}
                        >
                          <span
                            className="w-6 h-6 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${cat.color}20` }}
                          >
                            {Icon && <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />}
                          </span>
                          <span className="text-sm">{cat.name}</span>
                          <span className="text-xs text-[var(--text-muted)] ml-auto">
                            {entries.filter(e => e.category === cat.id).length}
                          </span>
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                备注
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="添加可选的备注信息"
                rows={3}
                className="input-dark resize-none"
              />
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          {showGenerator && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[var(--accent-green)]" />
                  密码生成器
                </h3>
                <button
                  onClick={() => setShowGenerator(false)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-[var(--bg-primary)]/80 border border-[var(--border-glass)]">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm tracking-wider text-[var(--text-primary)] break-all pr-2">
                      {password || '点击下方按钮生成'}
                    </p>
                    <button
                      onClick={handleCopyGenerated}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-green)] shrink-0"
                    >
                      {genCopied ? <Check className="w-4 h-4 text-[var(--accent-green)]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-[var(--text-secondary)]">密码长度</label>
                    <span className="text-xs font-semibold text-[var(--accent-green)]">{genLength}</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={32}
                    value={genLength}
                    onChange={e => setGenLength(parseInt(e.target.value))}
                    className="w-full accent-[var(--accent-green)]"
                  />
                </div>

                {[
                  { label: '大写字母 (A-Z)', value: genUpper, setter: setGenUpper },
                  { label: '小写字母 (a-z)', value: genLower, setter: setGenLower },
                  { label: '数字 (0-9)', value: genNumbers, setter: setGenNumbers },
                  { label: '特殊符号 (!@#$)', value: genSymbols, setter: setGenSymbols },
                ].map(opt => (
                  <div key={opt.label} className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">{opt.label}</span>
                    <div
                      className={`toggle-switch ${opt.value ? 'active' : ''}`}
                      onClick={() => opt.setter(!opt.value)}
                    />
                  </div>
                ))}

                <button
                  onClick={handleUseGenerated}
                  className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  生成并使用
                </button>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5"
          >
            <h3 className="font-display font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[var(--accent-yellow)]" />
              安全提示
            </h3>
            <ul className="space-y-2.5">
              {[
                '为每个账号使用唯一密码',
                '密码长度建议12位以上',
                '避免包含个人信息',
                '启用双因素认证',
                '定期更换重要账号密码',
              ].map((tip, i) => (
                <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[var(--accent-green)] mt-0.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>

      <div className="flex items-center gap-3 sticky bottom-4 z-30">
        <button
          onClick={() => navigate('/vault')}
          className="btn-secondary flex-1 max-w-xs"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          className="btn-primary flex-1 max-w-xs flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isEdit ? '保存修改' : '添加账号'}
        </button>
      </div>
    </div>
  )
}
