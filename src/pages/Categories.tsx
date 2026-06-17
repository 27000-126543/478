import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Landmark,
  Users,
  Briefcase,
  ShoppingCart,
  Gamepad2,
  Folder,
  Globe,
  Mail,
  Music,
  Camera,
  BookOpen,
  Heart,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { useStore } from '@/store'
import { isPasswordExpired, getDaysUntilExpiry } from '@/utils/password'
import { validateCategoryName } from '@/utils/validation'
import type { Category } from '@/types'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Landmark,
  Users,
  Briefcase,
  ShoppingCart,
  Gamepad2,
  Folder,
  Globe,
  Mail,
  Music,
  Camera,
  BookOpen,
  Heart,
}

const ICON_OPTIONS = Object.keys(ICON_MAP)

const PRESET_COLORS = [
  '#00D68F',
  '#3B82F6',
  '#A855F7',
  '#F59E0B',
  '#EC4899',
  '#EF4444',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
]

const UPDATE_CYCLE_OPTIONS = [
  { value: 30, label: '30天' },
  { value: 60, label: '60天' },
  { value: 90, label: '90天' },
  { value: 180, label: '180天' },
]

interface CategoryFormData {
  name: string
  icon: string
  color: string
  updateCycleDays: number
}

const defaultFormData: CategoryFormData = {
  name: '',
  icon: 'Folder',
  color: '#00D68F',
  updateCycleDays: 90,
}

export default function Categories() {
  const categories = useStore(s => s.categories)
  const entries = useStore(s => s.entries)
  const addCategory = useStore(s => s.addCategory)
  const updateCategory = useStore(s => s.updateCategory)
  const deleteCategory = useStore(s => s.deleteCategory)

  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData)
  const [formError, setFormError] = useState('')

  const openAddModal = () => {
    setEditingCategory(null)
    setFormData(defaultFormData)
    setFormError('')
    setShowModal(true)
  }

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      updateCycleDays: cat.updateCycleDays,
    })
    setFormError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setFormError('')
  }

  const handleSave = () => {
    const validation = validateCategoryName(formData.name)
    if (!validation.valid) {
      setFormError(validation.message)
      return
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: formData.name,
        icon: formData.icon,
        color: formData.color,
        updateCycleDays: formData.updateCycleDays,
      })
    } else {
      addCategory({
        name: formData.name,
        icon: formData.icon,
        color: formData.color,
        updateCycleDays: formData.updateCycleDays,
      })
    }
    closeModal()
  }

  const handleDelete = () => {
    if (deleteTarget) {
      deleteCategory(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const getEntryCount = (categoryId: string) =>
    entries.filter(e => e.category === categoryId).length

  const expiringEntries = entries
    .map(entry => {
      const cat = categories.find(c => c.id === entry.category)
      if (!cat) return null
      const days = getDaysUntilExpiry(entry.updatedAt, cat.updateCycleDays)
      const expired = isPasswordExpired(entry.updatedAt, cat.updateCycleDays)
      if (!expired && days > 7) return null
      return { entry, category: cat, days, expired }
    })
    .filter(Boolean) as { entry: typeof entries[0]; category: Category; days: number; expired: boolean }[]

  const getDaysColor = (days: number, expired: boolean) => {
    if (expired) return 'text-[var(--accent-red)]'
    if (days < 7) return 'text-[var(--accent-yellow)]'
    return 'text-[var(--accent-green)]'
  }

  const getDaysLabel = (days: number, expired: boolean) => {
    if (expired) return `已过期 ${Math.abs(days)} 天`
    if (days === 0) return '今天到期'
    return `${days} 天后到期`
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">分类管理</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">管理密码分类与更新周期</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          添加分类
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {categories.map((cat, index) => {
            const IconComponent = ICON_MAP[cat.icon] || Folder
            const count = getEntryCount(cat.id)
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card glass-card-hover relative group overflow-hidden"
              >
                <div
                  className="h-1.5 rounded-t-2xl"
                  style={{ background: cat.color }}
                />
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${cat.color}20` }}
                      >
                        <IconComponent className="w-5 h-5" style={{ color: cat.color }} />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-[var(--text-primary)]">{cat.name}</h3>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {count} 个账号 · 更新周期 {cat.updateCycleDays} 天
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-2 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="p-2 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {expiringEntries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--accent-yellow)]" />
            <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">到期提醒</h2>
          </div>
          <div className="glass-card overflow-hidden">
            {expiringEntries.map(({ entry, category, days, expired }, index) => {
              const CatIcon = ICON_MAP[category.icon] || Folder
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-glass)] last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${category.color}20` }}
                    >
                      <CatIcon className="w-4 h-4" style={{ color: category.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{entry.website}</p>
                      <p className="text-xs text-[var(--text-muted)]">{category.name}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${getDaysColor(days, expired)}`}>
                    {getDaysLabel(days, expired)}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  {editingCategory ? '编辑分类' : '添加分类'}
                </h2>
                <button onClick={closeModal} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">分类名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => { setFormData({ ...formData, name: e.target.value }); setFormError('') }}
                    placeholder="输入分类名称"
                    className={`input-dark ${formError ? 'error' : ''}`}
                    maxLength={20}
                  />
                  {formError && (
                    <p className="text-[var(--accent-red)] text-xs mt-1">{formError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">图标</label>
                  <select
                    value={formData.icon}
                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                    className="input-dark"
                  >
                    {ICON_OPTIONS.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">颜色</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-primary)] scale-110' : 'hover:scale-110'
                        }`}
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">更新周期</label>
                  <div className="flex gap-2">
                    {UPDATE_CYCLE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setFormData({ ...formData, updateCycleDays: opt.value })}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                          formData.updateCycleDays === opt.value
                            ? 'gradient-green text-[#0A0E27]'
                            : 'glass-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={closeModal} className="btn-secondary flex-1">取消</button>
                <button onClick={handleSave} className="btn-primary flex-1">
                  {editingCategory ? '保存修改' : '添加分类'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-red)]/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-[var(--accent-red)]" />
                </div>
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-2">删除分类</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-1">
                  确定要删除分类「{deleteTarget.name}」吗？
                </p>
                <p className="text-xs text-[var(--accent-yellow)] mb-6">
                  该分类下的所有条目将被移动到「其他」分类
                </p>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">取消</button>
                  <button onClick={handleDelete} className="gradient-red text-white font-semibold py-2.5 px-6 rounded-xl flex-1 hover:opacity-90 transition-opacity">
                    删除
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
