export type StrengthLevel = 'weak' | 'medium' | 'strong' | 'very-strong'

export interface PasswordEntry {
  id: string
  website: string
  url: string
  username: string
  password: string
  category: string
  notes: string
  strength: StrengthLevel
  strengthScore: number
  createdAt: number
  updatedAt: number
  lastChecked: number
  isBreached: boolean
  breachInfo?: BreachInfo
}

export interface BreachInfo {
  source: string
  breachDate: string
  description: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  updateCycleDays: number
}

export interface BreachRecord {
  id: string
  entryId: string
  source: string
  breachDate: string
  description: string
  resolved: boolean
}

export interface SecurityQuestion {
  question: string
  answerHash: string
}

export interface EmergencyContact {
  name: string
  email: string
  phone: string
  relation: string
}

export interface NotificationSettings {
  breachAlert: boolean
  updateReminder: boolean
  reminderDaysBefore: number
}

export interface UserSettings {
  masterPasswordHash: string
  securityQuestions: SecurityQuestion[]
  emergencyContacts: EmergencyContact[]
  notifications: NotificationSettings
}

export interface UpdateRecord {
  id: string
  entryId: string
  website: string
  updatedAt: number
}

export interface BreachEvent {
  id: string
  entryId: string
  website: string
  source: string
  breachDate: string
  resolved: boolean
  detectedAt: number
}

export interface SecurityReport {
  month: string
  overallScore: number
  strengthDistribution: Record<StrengthLevel, number>
  breachEvents: BreachEvent[]
  updateRecords: UpdateRecord[]
}
