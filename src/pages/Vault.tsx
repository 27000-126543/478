import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { isPasswordExpired, getDaysUntilExpiry } from '@/utils/password'
import type { PasswordEntry, Category, StrengthLevel } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  ShieldAlert,
  Clock,
  Key,
  Search,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Edit2,
  AlertTriangle,
  Check,
  Globe,
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

export default function Vault() {
  const navigate = useNavigate()
  const entries = useStore(s => s.entries)
  const categories = useStore(s => s.categories)
  const getWeakPasswords = useStore(s => s.getWeakPasswords)
  const getExpiredPasswords = useStore(s => s.getExpiredPasswords)
  const getBreachedPasswords = useStore(s => s.getBreachedPasswords)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const weakCount = getWeakPasswords().length
  const breachedCount = getBreachedPasswords().length
  const expiringCount = getExpiredPasswords().length
  const totalCount = entries.length

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch =
        !searchQuery ||
        entry.website.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.username.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        activeCategory === 'all' || entry.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [entries, searchQuery, activeCategory])

  const getCategoryById = (id: string): Category | undefined =>
    categories.find(c => c.id === id)

  const getCategoryColor = (id: string): string =>
    getCategoryById(id)?.color ?? '#6B7280'

  const securityCards = [
    {
      label: '弱密码',
      value: weakCount,
      icon: ShieldAlert,
      gradient: 'gradient-red',
      glow: 'glow-red',
      textColor: 'text-[var(--accent-red)]',
    },
    {
      label: '已泄露',
      value: breachedCount,
      icon: AlertTriangle,
      gradient: 'gradient-red',
      glow: 'glow-red',
      textColor: 'text-[var(--accent-red)]',
    },
    {
      label: '即将过期',
      value: expiringCount,
      icon: Clock,
      gradient: 'gradient-yellow',
      glow: '',
      textColor: 'text-[var(--accent-yellow)]',
    },
    {
      label: '总密码数',
      value: totalCount,
      icon: Key,
      gradient: 'gradient-green',
      glow: 'glow-green',
      textColor: 'text-[var(--accent-green)]',
    },
  ]

  return (
    <div className="space-y-6 pb-24">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {securityCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className={`glass-card p-4 relative overflow-hidden ${card.glow}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.gradient} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-[#0A0E27]" />
              </div>
              <span className={`font-display font-bold text-2xl ${card.textColor}`}>
                {card.value}
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        <button
          onClick={() => setActiveCategory('all')}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeCategory === 'all'
              ? 'gradient-green text-[#0A0E27]'
              : 'glass-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          全部
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeCategory === cat.id
                ? 'gradient-green text-[#0A0E27]'
                : 'glass-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: cat.color }}
            />
            {cat.name}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜索网站或用户名..."
          className="input-dark pl-11 w-full"
        />
      </div>

      <AnimatePresence mode="popLayout">
        {filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-12 text-center"
          >
            <Globe className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[var(--text-muted)]">
              {searchQuery ? '没有找到匹配的密码条目' : '密码库为空，点击右下角按钮添加'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((entry, index) => {
              const category = getCategoryById(entry.category)
              const categoryColor = getCategoryColor(entry.category)
              const isExpired = category
                ? isPasswordExpired(entry.updatedAt, category.updateCycleDays)
                : false
              const daysLeft = category
                ? getDaysUntilExpiry(entry.updatedAt, category.updateCycleDays)
                : 0
              const isBreached = entry.isBreached
              const isWeak = entry.strength === 'weak' || entry.strength === 'medium'
              const showPassword = visiblePasswords.has(entry.id)
              const isCopied = copiedId === entry.id

              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="glass-card-hover glass-card p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                        style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                      >
                        {entry.website.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-semibold text-[var(--text-primary)] truncate">
                            {entry.website}
                          </h3>
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: categoryColor }}
                          />
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${STRENGTH_BAR[entry.strength]}`}
                          />
                          {isBreached && (
                            <AlertTriangle className="w-4 h-4 text-[var(--accent-red)] shrink-0" />
                          )}
                          {isExpired && daysLeft > 0 && (
                            <Clock className="w-4 h-4 text-[var(--accent-yellow)] shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-[var(--text-muted)] truncate">
                          {entry.username}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-[var(--text-secondary)] font-mono tracking-wider">
                            {showPassword ? entry.password : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePassword(entry.id)}
                            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {isExpired && daysLeft > 0 && daysLeft <= 7 && (
                          <p className="text-xs text-[var(--accent-yellow)] mt-1">
                            即将过期，还剩 {daysLeft} 天
                          </p>
                        )}
                        {isBreached && entry.breachInfo && (
                          <p className="text-xs text-[var(--accent-red)] mt-1">
                            已在「{entry.breachInfo.source}」中泄露
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => copyToClipboard(entry.username, `${entry.id}-user`)}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-all"
                        title="复制用户名"
                      >
                        {copiedId === `${entry.id}-user` ? (
                          <Check className="w-4 h-4 text-[var(--accent-green)]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(entry.password, `${entry.id}-pass`)}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-all"
                        title="复制密码"
                      >
                        {copiedId === `${entry.id}-pass` ? (
                          <Check className="w-4 h-4 text-[var(--accent-green)]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => navigate(`/vault/edit/${entry.id}`)}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-all"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
        onClick={() => navigate('/vault/add')}
        className="fixed bottom-24 md:bottom-8 right-6 w-14 h-14 rounded-2xl gradient-green glow-green flex items-center justify-center shadow-lg shadow-[var(--accent-green)]/25 hover:shadow-[var(--accent-green)]/40 transition-shadow z-40"
      >
        <Plus className="w-6 h-6 text-[#0A0E27]" />
      </motion.button>
    </div>
  )
}
