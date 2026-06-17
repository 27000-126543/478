import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import type { SecurityReport, StrengthLevel } from '@/types'
import { generateSecurityReportPDF } from '@/utils/report'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import { FileDown, Shield, AlertTriangle, RefreshCw, ChevronDown } from 'lucide-react'

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

  const handleExportPDF = () => {
    const doc = generateSecurityReportPDF({
      ...reportData,
      entries,
    })
    doc.save('SafeVault-Report.pdf')
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
            onClick={handleExportPDF}
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
            </div>
            {reportData.breachEvents.length === 0 ? (
              <p className="text-[var(--text-muted)] text-sm py-4 text-center">{formatMonth(selectedMonth)}无泄露事件</p>
            ) : (
              <div className="space-y-3">
                {reportData.breachEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
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
    </div>
  )
}
