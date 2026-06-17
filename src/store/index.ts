import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PasswordEntry, Category, BreachRecord, UserSettings, BreachEvent, UpdateRecord, StrengthLevel } from '@/types'
import { hashPassword, checkBreach, MOCK_BREACH_DB } from '@/utils/password'

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-finance', name: '金融', icon: 'Landmark', color: '#00D68F', updateCycleDays: 30 },
  { id: 'cat-social', name: '社交', icon: 'Users', color: '#3B82F6', updateCycleDays: 90 },
  { id: 'cat-work', name: '工作', icon: 'Briefcase', color: '#A855F7', updateCycleDays: 60 },
  { id: 'cat-shopping', name: '购物', icon: 'ShoppingCart', color: '#F59E0B', updateCycleDays: 90 },
  { id: 'cat-entertainment', name: '娱乐', icon: 'Gamepad2', color: '#EC4899', updateCycleDays: 180 },
  { id: 'cat-other', name: '其他', icon: 'Folder', color: '#6B7280', updateCycleDays: 180 },
]

const DEFAULT_SETTINGS: UserSettings = {
  masterPasswordHash: '',
  securityQuestions: [],
  emergencyContacts: [],
  notifications: {
    breachAlert: true,
    updateReminder: true,
    reminderDaysBefore: 7,
  },
}

interface AppState {
  isAuthenticated: boolean
  entries: PasswordEntry[]
  categories: Category[]
  breachRecords: BreachRecord[]
  settings: UserSettings
  breachEvents: BreachEvent[]
  updateRecords: UpdateRecord[]
  lastScanDate: number | null

  login: (password: string) => boolean
  register: (password: string) => void
  logout: () => void
  verifyMasterPassword: (password: string) => boolean

  addEntry: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt' | 'lastChecked'>) => void
  updateEntry: (id: string, updates: Partial<PasswordEntry>) => void
  deleteEntry: (id: string) => void

  addCategory: (category: Omit<Category, 'id'>) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void

  addBreachRecord: (record: Omit<BreachRecord, 'id'>) => void
  resolveBreachRecord: (id: string) => void
  resolveBreachEventByEntryId: (entryId: string) => void

  runBreachScan: () => void
  updateSettings: (updates: Partial<UserSettings>) => void
  addUpdateRecord: (entryId: string, website: string) => void
  addBreachEvent: (event: Omit<BreachEvent, 'id' | 'detectedAt'>) => void

  getWeakPasswords: () => PasswordEntry[]
  getExpiredPasswords: () => PasswordEntry[]
  getBreachedPasswords: () => PasswordEntry[]
  getMonthlyReport: (month: string) => {
    month: string
    overallScore: number
    strengthDistribution: Record<StrengthLevel, number>
    breachEvents: BreachEvent[]
    updateRecords: UpdateRecord[]
  }
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      entries: [],
      categories: DEFAULT_CATEGORIES,
      breachRecords: [],
      settings: DEFAULT_SETTINGS,
      breachEvents: [],
      updateRecords: [],
      lastScanDate: null,

      login: (password: string) => {
        const hash = hashPassword(password)
        if (hash === get().settings.masterPasswordHash) {
          set({ isAuthenticated: true })
          return true
        }
        return false
      },

      register: (password: string) => {
        const hash = hashPassword(password)
        set({
          settings: { ...get().settings, masterPasswordHash: hash },
          isAuthenticated: true,
        })
      },

      logout: () => set({ isAuthenticated: false }),

      verifyMasterPassword: (password: string) => {
        return hashPassword(password) === get().settings.masterPasswordHash
      },

      addEntry: (entry) => {
        const now = Date.now()
        const newEntry: PasswordEntry = {
          ...entry,
          id: `entry-${now}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now,
          lastChecked: now,
        }
        set({ entries: [...get().entries, newEntry] })
      },

      updateEntry: (id, updates) => {
        const entry = get().entries.find(e => e.id === id)
        set({
          entries: get().entries.map(e =>
            e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
          ),
        })
        if (updates.password) {
          if (entry) {
            get().addUpdateRecord(id, entry.website)
            if (entry.isBreached) {
              get().resolveBreachEventByEntryId(id)
            }
          }
        }
      },

      deleteEntry: (id) => {
        set({ entries: get().entries.filter(e => e.id !== id) })
      },

      addCategory: (category) => {
        const newCategory: Category = {
          ...category,
          id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }
        set({ categories: [...get().categories, newCategory] })
      },

      updateCategory: (id, updates) => {
        set({
          categories: get().categories.map(c =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })
      },

      deleteCategory: (id) => {
        set({
          categories: get().categories.filter(c => c.id !== id),
          entries: get().entries.map(e =>
            e.category === id ? { ...e, category: 'cat-other' } : e
          ),
        })
      },

      addBreachRecord: (record) => {
        const newRecord: BreachRecord = {
          ...record,
          id: `breach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }
        set({ breachRecords: [...get().breachRecords, newRecord] })
      },

      resolveBreachRecord: (id) => {
        const record = get().breachRecords.find(r => r.id === id)
        set({
          breachRecords: get().breachRecords.map(r =>
            r.id === id ? { ...r, resolved: true } : r
          ),
        })
        if (record) {
          get().resolveBreachEventByEntryId(record.entryId)
        }
      },

      resolveBreachEventByEntryId: (entryId) => {
        set({
          breachEvents: get().breachEvents.map(be =>
            be.entryId === entryId && !be.resolved ? { ...be, resolved: true } : be
          ),
          entries: get().entries.map(e =>
            e.id === entryId ? { ...e, isBreached: false, breachInfo: undefined } : e
          ),
        })
      },

      runBreachScan: () => {
        const { entries, breachEvents } = get()

        const updatedEntries = entries.map(entry => {
          const result = checkBreach(entry.url)
          if (result.isBreached && result.breachInfo) {
            if (!entry.isBreached) {
              const alreadyEvent = breachEvents.some(
                be => be.entryId === entry.id && be.resolved === false
              )
              if (!alreadyEvent) {
                get().addBreachEvent({
                  entryId: entry.id,
                  website: entry.website,
                  source: result.breachInfo.source,
                  breachDate: result.breachInfo.breachDate,
                  resolved: false,
                })
              }
            }
            return {
              ...entry,
              isBreached: true,
              breachInfo: result.breachInfo,
              lastChecked: Date.now(),
            }
          }
          return { ...entry, lastChecked: Date.now() }
        })

        set({
          entries: updatedEntries,
          lastScanDate: Date.now(),
        })
      },

      updateSettings: (updates) => {
        set({ settings: { ...get().settings, ...updates } })
      },

      addUpdateRecord: (entryId, website) => {
        const record: UpdateRecord = {
          id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          entryId,
          website,
          updatedAt: Date.now(),
        }
        set({ updateRecords: [...get().updateRecords, record] })
      },

      addBreachEvent: (event) => {
        const newEvent: BreachEvent = {
          ...event,
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          detectedAt: Date.now(),
        }
        set({ breachEvents: [...get().breachEvents, newEvent] })
      },

      getWeakPasswords: () => {
        return get().entries.filter(e => e.strength === 'weak' || e.strength === 'medium')
      },

      getExpiredPasswords: () => {
        const { entries, categories } = get()
        return entries.filter(entry => {
          const category = categories.find(c => c.id === entry.category)
          if (!category) return false
          const cycleMs = category.updateCycleDays * 24 * 60 * 60 * 1000
          return Date.now() - entry.updatedAt > cycleMs
        })
      },

      getBreachedPasswords: () => {
        return get().entries.filter(e => e.isBreached)
      },

      getMonthlyReport: (month: string) => {
        const entries = get().entries
        const strengthDistribution: Record<StrengthLevel, number> = {
          'weak': 0,
          'medium': 0,
          'strong': 0,
          'very-strong': 0,
        }

        entries.forEach(e => {
          strengthDistribution[e.strength] = (strengthDistribution[e.strength] || 0) + 1
        })

        const totalEntries = entries.length || 1
        const strongCount = (strengthDistribution['strong'] || 0) + (strengthDistribution['very-strong'] || 0)
        const overallScore = Math.round((strongCount / totalEntries) * 100)

        const monthBreachEvents = get().breachEvents.filter(e => {
          const d = new Date(e.detectedAt)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          return key === month
        })

        const monthUpdateRecords = get().updateRecords.filter(r => {
          const d = new Date(r.updatedAt)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          return key === month
        })

        return {
          month,
          overallScore,
          strengthDistribution,
          breachEvents: monthBreachEvents,
          updateRecords: monthUpdateRecords,
        }
      },
    }),
    {
      name: 'safevault-storage',
      partialize: (state) => ({
        entries: state.entries,
        categories: state.categories,
        breachRecords: state.breachRecords,
        settings: state.settings,
        breachEvents: state.breachEvents,
        updateRecords: state.updateRecords,
        lastScanDate: state.lastScanDate,
      }),
    }
  )
)
