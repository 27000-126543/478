import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { checkBreach, evaluatePasswordStrength } from '@/utils/password'
import type { PasswordEntry, BreachInfo } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, Shield, Scan, ShieldAlert, CheckCircle2, Clock,
  RefreshCw, ChevronRight, Globe, ShieldCheck, ExternalLink,
  ArrowRight, TrendingUp, ShieldOff, Eye, EyeOff, Copy, Check,
} from 'lucide-react'

export default function BreachDetect() {
  const navigate = useNavigate()
  const entries = useStore(s => s.entries)
  const lastScanDate = useStore(s => s.lastScanDate)
  const runBreachScan = useStore(s => s.runBreachScan)
  const updateEntry = useStore(s => s.updateEntry)

  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanCount, setScanCount] = useState(0)
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const breachedEntries = useMemo(() => entries.filter(e => e.isBreached), [entries])
  const safeEntries = useMemo(() => entries.filter(e => !e.isBreached), [entries])

  const performScan = () => {
    if (scanning || entries.length === 0) return

    setScanning(true)
    setScanProgress(0)
    setScanCount(0)

    let currentIndex = 0
    const total = entries.length

    const processNext = () => {
      if (currentIndex >= total) {
        setScanProgress(100)
        setTimeout(() => {
          setScanning(false)
        }, 500)
        return
      }

      const entry = entries[currentIndex]
      const result = checkBreach(entry.url)

      if (result.isBreached && result.breachInfo) {
        updateEntry(entry.id, {
          isBreached: true,
          breachInfo: result.breachInfo,
          lastChecked: Date.now(),
        })
      } else {
        updateEntry(entry.id, {
          isBreached: false,
          breachInfo: undefined,
          lastChecked: Date.now(),
        })
      }

      currentIndex++
      setScanCount(currentIndex)
      setScanProgress(Math.round((currentIndex / total) * 100))

      setTimeout(processNext, 200 + Math.random() * 300)
    }

    runBreachScan()
    processNext()
  }

  useEffect(() => {
    if (!lastScanDate && entries.length > 0) {
      const timer = setTimeout(() => performScan(), 1000)
      return () => clearTimeout(timer)
    }
  }, [entries.length])

  const handleFixPassword = (entry: PasswordEntry) => {
    navigate(`/vault/edit/${entry.id}`)
  }

  const handleMarkFixed = (entry: PasswordEntry) => {
    updateEntry(entry.id, {
      isBreached: false,
      breachInfo: undefined,
    })
  }

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatScanTime = (ts: number | null) => {
    if (!ts) return '未扫描'
    const date = new Date(ts)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const daysSinceLastScan = lastScanDate
    ? Math.floor((Date.now() - lastScanDate) / (24 * 60 * 60 * 1000))
    : null

  const needsRescan = daysSinceLastScan !== null && daysSinceLastScan >= 1

  const stats = useMemo(() => ({
    total: entries.length,
    scanned: entries.filter(e => e.lastChecked).length,
    breached: breachedEntries.length,
    safe: safeEntries.length,
  }), [entries, breachedEntries, safeEntries])

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-red flex items-center justify-center glow-red">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">泄露检测</h1>
            <p className="text-[var(--text-muted)] text-sm mt-0.5">检测密码是否出现在公开数据泄露库中</p>
          </div>
        </div>
        <button
          onClick={performScan}
          disabled={scanning || entries.length === 0}
          className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {scanning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Scan className="w-4 h-4" />
          )}
          {scanning ? `扫描中 ${scanProgress}%` : (needsRescan ? '重新扫描' : '立即扫描')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '总账号', value: stats.total, icon: Globe, color: 'gradient-blue', glow: 'glow-blue', text: 'text-[var(--accent-blue)]' },
          { label: '已扫描', value: stats.scanned, icon: Shield, color: 'gradient-green', glow: '', text: 'text-[var(--accent-green)]' },
          { label: '已泄露', value: stats.breached, icon: ShieldAlert, color: 'gradient-red', glow: stats.breached > 0 ? 'glow-red' : '', text: 'text-[var(--accent-red)]' },
          { label: '安全', value: stats.safe, icon: ShieldCheck, color: 'gradient-green', glow: '', text: 'text-[var(--accent-green)]' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass-card p-4 ${card.glow}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${card.color} flex items-center justify-center`}>
                <card.icon className="w-4.5 h-4.5 text-[#0A0E27]" />
              </div>
              <span className={`font-display font-bold text-2xl ${card.text}`}>{card.value}</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scan className="w-5 h-5 text-[var(--accent-blue)]" />
              <h3 className="font-display font-semibold text-lg text-[var(--text-primary)]">扫描状态</h3>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)]">
                上次: {formatScanTime(lastScanDate)}
              </span>
              {needsRescan && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)] ml-1">
                  建议重新扫描
                </span>
              )}
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="py-8 text-center">
              <Globe className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-50" />
              <p className="text-[var(--text-muted)] text-sm">暂无账号，请先添加密码</p>
              <button
                onClick={() => navigate('/vault/add')}
                className="mt-3 text-xs text-[var(--accent-green)] hover:text-[var(--accent-green-light)] flex items-center gap-1 mx-auto"
              >
                立即添加 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div>
              <div className="relative h-3 rounded-full bg-white/5 overflow-hidden mb-3">
                {scanning && (
                  <motion.div
                    className="absolute inset-y-0 left-0 w-full opacity-30"
                    style={{
                      background: 'linear-gradient(90deg, transparent, var(--accent-green), transparent)',
                      animation: 'scan-line 1.5s linear infinite',
                    }}
                  />
                )}
                <motion.div
                  className="h-full rounded-full gradient-green"
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">
                  {scanning ? (
                    <span className="flex items-center gap-1.5 text-[var(--accent-green)]">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      正在扫描: {scanCount} / {stats.total}
                    </span>
                  ) : (
                    `已扫描 ${stats.scanned} / ${stats.total} 个账号`
                  )}
                </span>
                <span className="text-[var(--text-muted)]">{scanProgress}%</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {scanning && breachedEntries.length === 0 ? null : breachedEntries.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 px-1">
            <ShieldAlert className="w-5 h-5 text-[var(--accent-red)]" />
            <h3 className="font-display font-semibold text-lg text-[var(--accent-red)]">
              泄露预警
              <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
                ({breachedEntries.length} 个账号存在风险)
              </span>
            </h3>
          </div>

          <AnimatePresence>
            {breachedEntries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card border-l-4 border-l-[var(--accent-red)] p-5 overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[var(--accent-red)]/5 -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-display font-semibold text-[var(--text-primary)] text-lg">
                          {entry.website}
                        </h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-red)]/15 text-[var(--accent-red)] font-medium">
                          已泄露
                        </span>
                        {entry.strength === 'weak' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-yellow)]/15 text-[var(--accent-yellow)] font-medium">
                            弱密码
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                          <span className="text-[var(--text-muted)] text-xs">URL:</span>
                          <span className="text-[var(--text-secondary)] truncate">{entry.url || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                          <span className="text-[var(--text-muted)] text-xs">账号:</span>
                          <span className="text-[var(--text-secondary)] truncate">{entry.username}</span>
                        </div>
                        <div className="flex items-center gap-2 md:col-span-2">
                          <span className="text-[var(--text-muted)] text-xs w-16 shrink-0">密码:</span>
                          <span className="font-mono tracking-wider text-[var(--text-secondary)]">
                            {visiblePasswords.has(entry.id) ? entry.password : '••••••••••••'}
                          </span>
                          <button
                            onClick={() => togglePassword(entry.id)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                          >
                            {visiblePasswords.has(entry.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(entry.password, entry.id)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-green)]"
                          >
                            {copiedId === entry.id ? <Check className="w-3.5 h-3.5 text-[var(--accent-green)]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {entry.breachInfo && (
                        <div className="mt-3 p-3 rounded-xl bg-[var(--accent-red)]/8 border border-[var(--accent-red)]/20">
                          <p className="text-xs text-[var(--accent-red)] font-semibold mb-1.5 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            泄露详情
                          </p>
                          <div className="space-y-1">
                            <p className="text-xs text-[var(--text-secondary)]">
                              <span className="text-[var(--text-muted)]">来源: </span>
                              {entry.breachInfo.source}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              <span className="text-[var(--text-muted)]">发生日期: </span>
                              {entry.breachInfo.breachDate}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {entry.breachInfo.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col gap-2 shrink-0 md:min-w-[140px]">
                      <button
                        onClick={() => handleFixPassword(entry)}
                        className="btn-primary text-xs flex items-center justify-center gap-1.5 flex-1 md:w-full"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        立即修复
                      </button>
                      <button
                        onClick={() => handleMarkFixed(entry)}
                        className="btn-secondary text-xs flex items-center justify-center gap-1.5 flex-1 md:w-full"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        标记已修复
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        !scanning && entries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-10 text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl gradient-green flex items-center justify-center mx-auto mb-4 glow-green"
            >
              <ShieldCheck className="w-8 h-8 text-[#0A0E27]" />
            </motion.div>
            <h3 className="font-display font-bold text-xl text-[var(--accent-green)] mb-2">
              一切安全！
            </h3>
            <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">
              您的 {entries.length} 个账号均未在公开数据泄露库中发现，继续保持良好的安全习惯。
            </p>
            <div className="flex items-center justify-center gap-4 mt-6 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                定期更新密码
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                使用唯一密码
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                启用2FA认证
              </span>
            </div>
          </motion.div>
        )
      )}

      {safeEntries.length > 0 && !scanning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-[var(--border-glass)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--accent-green)]" />
              <h3 className="font-display font-semibold text-lg text-[var(--text-primary)]">
                安全账号
                <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
                  ({safeEntries.length})
                </span>
              </h3>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {safeEntries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.01 }}
                className="flex items-center justify-between p-4 border-b border-[var(--border-glass)] last:border-b-0 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-green)]/10 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-[var(--accent-green)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{entry.website}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{entry.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-[var(--text-muted)] hidden sm:block">
                    {entry.lastChecked
                      ? `${Math.floor((Date.now() - entry.lastChecked) / 3600000)}小时前扫描`
                      : '未扫描'}
                  </span>
                  <button
                    onClick={() => navigate(`/vault/edit/${entry.id}`)}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-green)] hover:bg-white/[0.03] transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
