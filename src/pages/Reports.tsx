import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import type { SecurityReport, StrengthLevel } from '@/types'
import { generateSecurityReportPDF, getReportFileName } from '@/utils/report'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileDown, Shield, AlertTriangle, RefreshCw, ChevronDown,
  X, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Download,
} from 'lucide-react'

const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  weak: '#FF4757',
  medium: '#FFA502',
  strong: '#00D68F',
  'very-strong': '#00B4D8',
}

const STRENGTH_LABELS: Record<StrengthLevel, string> = {
  weak: '弱',
  medium: '中等',
  strong: '强',
  'very-strong': '非常强',
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#00D68F'
  if (score >= 60) return '#FFA502'
  return '#FF4757'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return '安全'
  if (score >= 60) return '需注意'
  return '危险'
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  return `${year}年${parseInt(m)}月`
}

export default function Reports() {
  const entries = useStore(s => s.entries)
  const getMonthlyReport = useStore(s => s.getMonthlyReport)

  const recentMonths = useMemo(() => {
    const months: string[] = []
    const now = new Date()
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    return months
  }, [])

  const [selectedMonth, setSelectedMonth] = useState(recentMonths[0])
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const [showExportModal, setShowExportModal] = useState(false)
  const [exportPassword, setExportPassword] = useState('')
  const [exportConfirmPassword, setExportConfirmPassword] = useState('')
  const [showExportPwd, setShowExportPwd] = useState(false)
  const [showExportConfirmPwd, setShowExportConfirmPwd] = useState(false)
  const [exportError, setExportError] = useState('')
  const [exporting, setExporting] = useState(false)

  const reportData = useMemo(() => getMonthlyReport(selectedMonth), [selectedMonth, getMonthlyReport])

  const hasData = reportData.breachEvents.length > 0 || reportData.updateRecords.length > 0 || entries.length > 0

  const pieData = useMemo(() => {
    return (Object.entries(reportData.strengthDistribution) as [StrengthLevel, number][])
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name: STRENGTH_LABELS[name],
        value,
        key: name,
      }))
  }, [reportData.strengthDistribution])

  const openExportModal = () => {
    setShowExportModal(true)
    setExportPassword('')
    setExportConfirmPassword('')
    setExportError('')
    setExporting(false)
  }

  const closeExportModal = () => {
    if (!exporting) {
      setShowExportModal(false)
    }
  }

  const handleConfirmExport = async () => {
    if (!exportPassword.trim()) {
      setExportError('请输入导出密码')
      return
    }
    if (exportPassword.length < 4) {
      setExportError('导出密码至少需要4位字符')
      return
    }
    if (exportPassword !== exportConfirmPassword) {
      setExportError('两次输入的密码不一致')
      return
    }

    setExportError('')
    setExporting(true)

    try {
      const pdfBlob = await generateSecurityReportPDF(
        {
          ...reportData,
          entries,
        },
        exportPassword
      )

      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = getReportFileName(formatMonth(selectedMonth))
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)

      setExporting(false)
      setShowExportModal(false)
    } catch (e) {
      console.error(e)
      setExportError('PDF生成失败，请稍后重试')
      setExporting(false)
    }
  }

  const scoreColor = getScoreColor(reportData.overallScore)
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (reportData.overallScore / 100) * circumference

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#0A0E27]" />
          </div>
          <h1 className="font-display font-bold text-xl text-[var(--text-primary)]">安全报告</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              {formatMonth(selectedMonth)}
              <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 glass-card p-2 min-w-[160px] z-50">
                {recentMonths.map(month => (
                  <button
                    key={month}
                    onClick={() => { setSelectedMonth(month); setDropdownOpen(false) }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      month === selectedMonth
                        ? 'bg-[var(--accent-green)]/20 text-[var(--accent-green)]'
                        : 'text-[var(--text-secondary)] hover:bg-white/5'
                    }`}
                  >
                    {formatMonth(month)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={openExportModal}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <FileDown className="w-4 h-4" />
            导出PDF
          </button>
        </div>
      </div>

      {!hasData ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 flex flex-col items-center justify-center"
        >
          <Shield className="w-16 h-16 text-[var(--text-muted)] mb-4" />
          <p className="text-[var(--text-muted)] text-lg">暂无数据</p>
          <p className="text-[var(--text-muted)] text-sm mt-2">{formatMonth(selectedMonth)}没有安全报告数据</p>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 flex flex-col items-center"
            >
              <h2 className="font-display font-semibold text-[var(--text-primary)] text-lg mb-6">综合安全评分</h2>
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60" cy="60" r="54"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60" cy="60" r="54"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display font-bold text-3xl" style={{ color: scoreColor }}>
                    {reportData.overallScore}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{getScoreLabel(reportData.overallScore)}</span>
                </div>
              </div>
              <p className="text-[var(--text-muted)] text-sm mt-4">
                共 {entries.length} 个密码条目
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h2 className="font-display font-semibold text-[var(--text-primary)] text-lg mb-4">强度分布</h2>
              {pieData.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-[var(--text-muted)]">暂无数据</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {pieData.map(entry => (
                        <Cell key={entry.key} fill={STRENGTH_COLORS[entry.key as StrengthLevel]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(17, 22, 56, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#F1F5F9',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span style={{ color: '#94A3B8', fontSize: '12px' }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex flex-wrap gap-3 mt-2">
                {(Object.entries(STRENGTH_LABELS) as [StrengthLevel, string][]).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: STRENGTH_COLORS[key] }} />
                    {label}: {reportData.strengthDistribution[key]}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-[var(--accent-red)]" />
              <h2 className="font-display font-semibold text-[var(--text-primary)] text-lg">泄露事件</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${
                reportData.breachEvents.every(e => e.resolved) && reportData.breachEvents.length > 0
                  ? 'bg-[var(--accent-green)]/20 text-[var(--accent-green)]'
                  : reportData.breachEvents.length > 0
                    ? 'bg-[var(--accent-red)]/20 text-[var(--accent-red)]'
                    : 'bg-white/5 text-[var(--text-muted)]'
              }`}>
                {reportData.breachEvents.length === 0
                  ? '0 起'
                  : `${reportData.breachEvents.filter(e => !e.resolved).length} 起待解决 / ${reportData.breachEvents.length} 起总计`}
              </span>
            </div>
            {reportData.breachEvents.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-[var(--accent-green)] mb-2" />
                <p className="text-[var(--text-muted)] text-sm">{formatMonth(selectedMonth)}无泄露事件</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reportData.breachEvents.map(event => (
                  <div key={event.id} className={`flex items-center justify-between p-3 rounded-xl border ${
                    event.resolved
                      ? 'bg-white/[0.02] border-[var(--accent-green)]/20'
                      : 'bg-[var(--accent-red)]/5 border-l-4 border-l-[var(--accent-red)] border-r-0 border-t-0 border-b-0 border-white/[0.05]'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-primary)] text-sm font-medium truncate">{event.website}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          event.resolved
                            ? 'bg-[var(--accent-green)]/20 text-[var(--accent-green)]'
                            : 'bg-[var(--accent-red)]/20 text-[var(--accent-red)]'
                        }`}>
                          {event.resolved ? '已解决' : '未解决'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[var(--text-muted)] text-xs">来源: {event.source}</span>
                        <span className="text-[var(--text-muted)] text-xs">日期: {event.breachDate}</span>
                        <span className="text-[var(--text-muted)] text-xs">
                          检测: {new Date(event.detectedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-5 h-5 text-[var(--accent-blue)]" />
              <h2 className="font-display font-semibold text-[var(--text-primary)] text-lg">更新记录</h2>
              <span className="text-xs px-2 py-0.5 rounded-full ml-2 bg-[var(--accent-blue)]/15 text-[var(--accent-blue)]">
                {reportData.updateRecords.length} 次
              </span>
            </div>
            {reportData.updateRecords.length === 0 ? (
              <p className="text-[var(--text-muted)] text-sm py-4 text-center">{formatMonth(selectedMonth)}无更新记录</p>
            ) : (
              <div className="space-y-3">
                {reportData.updateRecords.map(record => (
                  <div key={record.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-[var(--text-primary)] text-sm">{record.website}</span>
                    <span className="text-[var(--text-muted)] text-xs">
                      {new Date(record.updatedAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}

      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={closeExportModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-sm p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl gradient-green flex items-center justify-center">
                    <Lock className="w-4 h-4 text-[#0A0E27]" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-[var(--text-primary)]">导出加密PDF</h3>
                    <p className="text-xs text-[var(--text-muted)]">{formatMonth(selectedMonth)}</p>
                  </div>
                </div>
                <button
                  onClick={closeExportModal}
                  disabled={exporting}
                  className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/30">
                  <p className="text-xs text-[var(--accent-blue)] leading-relaxed">
                    🔒 PDF报告将使用AES加密保护。打开时需要输入下方设置的密码，请妥善保管。
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">导出密码</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type={showExportPwd ? 'text' : 'password'}
                      value={exportPassword}
                      onChange={(e) => { setExportPassword(e.target.value); setExportError('') }}
                      placeholder="至少4位"
                      className={`input-dark pl-11 pr-11 ${exportError ? 'error' : ''}`}
                      autoFocus
                      disabled={exporting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowExportPwd(!showExportPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      {showExportPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">确认导出密码</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type={showExportConfirmPwd ? 'text' : 'password'}
                      value={exportConfirmPassword}
                      onChange={(e) => { setExportConfirmPassword(e.target.value); setExportError('') }}
                      placeholder="请再次输入"
                      className={`input-dark pl-11 pr-11 ${exportError ? 'error' : ''}`}
                      disabled={exporting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowExportConfirmPwd(!showExportConfirmPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      {showExportConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {exportError && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[var(--accent-red)] text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> {exportError}
                  </motion.p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeExportModal}
                    disabled={exporting}
                    className="btn-secondary flex-1 text-sm disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmExport}
                    disabled={exporting}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {exporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        确认导出
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
