import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { generatePassword, evaluatePasswordStrength, hashPassword } from '@/utils/password'
import type { StrengthLevel } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, RefreshCw, Copy, Check, Shield, Eye, EyeOff,
  Lock, History, Trash2, Clock,
} from 'lucide-react'

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

const STRENGTH_TEXT: Record<StrengthLevel, string> = {
  weak: 'text-[var(--accent-red)]',
  medium: 'text-[var(--accent-yellow)]',
  strong: 'text-[var(--accent-green)]',
  'very-strong': 'text-cyan-400',
}

const STRENGTH_BG: Record<StrengthLevel, string> = {
  weak: 'bg-[var(--accent-red)]/10',
  medium: 'bg-[var(--accent-yellow)]/10',
  strong: 'bg-[var(--accent-green)]/10',
  'very-strong': 'bg-cyan-400/10',
}

interface GeneratedHistoryItem {
  id: string
  password: string
  timestamp: number
  strength: StrengthLevel
  score: number
}

export default function Generator() {
  const settings = useStore(s => s.settings)
  const updateSettings = useStore(s => s.updateSettings)

  const [length, setLength] = useState(16)
  const [uppercase, setUppercase] = useState(true)
  const [lowercase, setLowercase] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<GeneratedHistoryItem[]>([])

  const strength = useMemo(() => password ? evaluatePasswordStrength(password) : { level: 'weak' as StrengthLevel, score: 0, suggestions: [] }, [password])

  const atLeastOne = uppercase || lowercase || numbers || symbols

  const handleGenerate = () => {
    if (!atLeastOne) return
    const pwd = generatePassword({ length, uppercase, lowercase, numbers, symbols })
    setPassword(pwd)
    const evalResult = evaluatePasswordStrength(pwd)
    setHistory(prev => [
      {
        id: `gen-${Date.now()}`,
        password: pwd,
        timestamp: Date.now(),
        strength: evalResult.level,
        score: evalResult.score,
      },
      ...prev.slice(0, 19),
    ])
  }

  const handleCopy = async () => {
    if (!password) return
    await navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClearHistory = () => {
    setHistory([])
  }

  const handleUseFromHistory = (item: GeneratedHistoryItem) => {
    setPassword(item.password)
  }

  const handleCopyFromHistory = async (pwd: string) => {
    await navigator.clipboard.writeText(pwd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const presetConfigs = [
    { name: '超强', length: 24, upper: true, lower: true, num: true, sym: true },
    { name: '推荐', length: 16, upper: true, lower: true, num: true, sym: true },
    { name: '平衡', length: 12, upper: true, lower: true, num: true, sym: false },
    { name: '精简', length: 8, upper: true, lower: true, num: true, sym: false },
  ]

  const applyPreset = (preset: typeof presetConfigs[0]) => {
    setLength(preset.length)
    setUppercase(preset.upper)
    setLowercase(preset.lower)
    setNumbers(preset.num)
    setSymbols(preset.sym)
  }

  const entropy = useMemo(() => {
    if (!password) return 0
    let poolSize = 0
    if (/[a-z]/.test(password)) poolSize += 26
    if (/[A-Z]/.test(password)) poolSize += 26
    if (/[0-9]/.test(password)) poolSize += 10
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32
    if (poolSize === 0) return 0
    return Math.round(password.length * Math.log2(poolSize))
  }, [password])

  const formatTime = (ts: number) => {
    const date = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - ts
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6 pb-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center glow-green">
          <Zap className="w-5 h-5 text-[#0A0E27]" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">密码生成器</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">一键生成符合安全标准的强密码</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="glass-card p-6 md:p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-[var(--accent-green)]" />
                <span className="text-sm font-medium text-[var(--text-secondary)]">生成的密码</span>
                {entropy > 0 && (
                  <span className="ml-auto text-xs text-[var(--text-muted)]">
                    熵值: {entropy} bits
                  </span>
                )}
              </div>
              <div className="relative p-4 md:p-5 rounded-2xl bg-[var(--bg-primary)]/80 border-2 border-[var(--border-glass)] focus-within:border-[var(--accent-green)]/50 transition-colors">
                <p className="font-mono text-xl md:text-2xl tracking-widest break-all pr-16 md:pr-20 min-h-[32px] text-[var(--text-primary)]">
                  {showPassword ? password : password.replace(/./g, '•') || <span className="text-[var(--text-muted)] text-base tracking-normal">点击下方按钮生成密码</span>}
                </p>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-green)] hover:bg-white/5 transition-all"
                  >
                    {copied ? <Check className="w-5 h-5 text-[var(--accent-green)]" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-green)] hover:bg-white/5 transition-all"
                    disabled={!atLeastOne}
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 flex gap-1">
                      {[0, 1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden"
                        >
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{
                              height: strength.score > i * 20 ? '100%' : '0%',
                              background: STRENGTH_BAR[strength.level].replace('strength-bar-', '').startsWith('very') ? '#00B4D8' : undefined,
                            }}
                            transition={{ delay: i * 0.05 }}
                            className={`w-full rounded-full ${STRENGTH_BAR[strength.level]}`}
                          />
                        </div>
                      ))}
                    </div>
                    <span className={`text-sm font-semibold whitespace-nowrap ${STRENGTH_TEXT[strength.level]}`}>
                      {STRENGTH_LABEL[strength.level]} · {strength.score}
                    </span>
                  </div>
                  {strength.suggestions.length > 0 && (
                    <div className={`mt-3 p-3 rounded-xl ${STRENGTH_BG[strength.level]}`}>
                      <ul className="space-y-1">
                        {strength.suggestions.map((s, i) => (
                          <li key={i} className={`text-xs flex items-center gap-1.5 ${STRENGTH_TEXT[strength.level]}`}>
                            <span className="w-1 h-1 rounded-full" style={{
                              background: strength.level === 'weak' ? 'var(--accent-red)' : 'var(--accent-yellow)',
                            }} />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={!atLeastOne}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base glow-green disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap className="w-5 h-5" />
              {password ? '重新生成' : '生成密码'}
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="font-display font-semibold text-[var(--text-primary)] mb-4">
              参数配置
            </h3>

            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-[var(--text-secondary)]">密码长度</label>
                  <span className="font-display font-bold text-lg text-[var(--accent-green)]">{length}</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={4}
                    max={64}
                    value={length}
                    onChange={e => setLength(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[var(--accent-green)]"
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-[var(--text-muted)]">4</span>
                    <span className="text-[10px] text-[var(--text-muted)]">16</span>
                    <span className="text-[10px] text-[var(--text-muted)]">32</span>
                    <span className="text-[10px] text-[var(--text-muted)]">48</span>
                    <span className="text-[10px] text-[var(--text-muted)]">64</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {presetConfigs.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="glass-card p-3 text-left transition-all hover:border-[var(--accent-green)]/30 group"
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-green)] transition-colors">
                      {preset.name}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {preset.length}位 · 大小写{preset.num ? '·数字' : ''}{preset.sym ? '·符号' : ''}
                    </p>
                  </button>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { label: '大写字母', example: 'A-Z', value: uppercase, setter: setUppercase },
                  { label: '小写字母', example: 'a-z', value: lowercase, setter: setLowercase },
                  { label: '数字', example: '0-9', value: numbers, setter: setNumbers },
                  { label: '特殊符号', example: '!@#$%', value: symbols, setter: setSymbols },
                ].map(opt => (
                  <div key={opt.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold transition-colors ${
                        opt.value ? 'gradient-green text-[#0A0E27]' : 'bg-white/5 text-[var(--text-muted)]'
                      }`}>
                        {opt.label.charAt(0)}
                      </div>
                      <div>
                        <p className={`text-sm font-medium transition-colors ${
                          opt.value ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                        }`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] font-mono">{opt.example}</p>
                      </div>
                    </div>
                    <div
                      className={`toggle-switch ${opt.value ? 'active' : ''}`}
                      onClick={() => opt.setter(!opt.value)}
                    />
                  </div>
                ))}
                {!atLeastOne && (
                  <p className="text-xs text-[var(--accent-red)] text-center py-2">
                    请至少选择一种字符类型
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <History className="w-4 h-4 text-[var(--accent-blue)]" />
                生成历史
              </h3>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-red)] flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  清空
                </button>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {history.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-8 text-center"
                >
                  <Clock className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-[var(--text-muted)]">暂无生成记录</p>
                  <p className="text-xs text-[var(--text-muted)] opacity-70 mt-1">最近20条记录将保存在此</p>
                </motion.div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {history.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.02 }}
                      className="group p-3 rounded-xl bg-white/[0.02] border border-transparent hover:border-white/[0.08] transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`flex-1 min-w-0 flex items-center gap-1.5`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${STRENGTH_BAR[item.strength]}`} />
                          <span className={`text-[10px] font-medium ${STRENGTH_TEXT[item.strength]}`}>
                            {item.score}分
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(item.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 font-mono text-xs tracking-wider text-[var(--text-primary)] truncate">
                          {showPassword ? item.password : item.password.replace(/./g, '•')}
                        </p>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCopyFromHistory(item.password)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-green)] hover:bg-white/5 transition-all"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleUseFromHistory(item)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-green)] hover:bg-white/5 transition-all"
                            title="使用此密码"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="glass-card p-5"
          >
            <h3 className="font-display font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--accent-green)]" />
              强度参考
            </h3>
            <div className="space-y-2.5">
              {[
                { level: '弱' as const, score: '0-40分', desc: '极易被破解，立即修改', color: 'var(--accent-red)' },
                { level: '中' as const, score: '40-60分', desc: '安全度一般，建议加强', color: 'var(--accent-yellow)' },
                { level: '强' as const, score: '60-80分', desc: '较为安全，推荐使用', color: 'var(--accent-green)' },
                { level: '极强' as const, score: '80-100分', desc: '极高安全性，最佳选择', color: '#00B4D8' },
              ].map(item => (
                <div key={item.level} className="flex items-center gap-3 p-2 rounded-lg">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: item.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{item.level}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{item.score}</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
