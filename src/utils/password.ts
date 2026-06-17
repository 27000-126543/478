import CryptoJS from 'crypto-js'
import type { StrengthLevel } from '@/types'

export function encrypt(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString()
}

export function decrypt(encryptedData: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString()
}

export function evaluatePasswordStrength(password: string): {
  level: StrengthLevel
  score: number
  suggestions: string[]
} {
  let score = 0
  const suggestions: string[] = []

  if (password.length === 0) {
    return { level: 'weak', score: 0, suggestions: ['请输入密码'] }
  }

  if (password.length >= 8) score += 15
  else suggestions.push('密码长度至少8位')

  if (password.length >= 12) score += 10
  if (password.length >= 16) score += 10

  if (/[a-z]/.test(password)) score += 10
  else suggestions.push('包含小写字母')

  if (/[A-Z]/.test(password)) score += 15
  else suggestions.push('包含大写字母')

  if (/[0-9]/.test(password)) score += 15
  else suggestions.push('包含数字')

  if (/[^a-zA-Z0-9]/.test(password)) score += 20
  else suggestions.push('包含特殊字符')

  const uniqueChars = new Set(password).size
  if (uniqueChars >= password.length * 0.7) score += 5
  else suggestions.push('避免过多重复字符')

  if (/(.)\1{2,}/.test(password)) {
    score -= 10
    suggestions.push('避免连续重复字符')
  }

  if (/^(123|abc|qwerty|password|admin)/i.test(password)) {
    score -= 20
    suggestions.push('避免常见密码模式')
  }

  score = Math.max(0, Math.min(100, score))

  let level: StrengthLevel = 'weak'
  if (score >= 80) level = 'very-strong'
  else if (score >= 60) level = 'strong'
  else if (score >= 40) level = 'medium'

  return { level, score, suggestions }
}

export function generatePassword(options: {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
}): string {
  const { length, uppercase, lowercase, numbers, symbols } = options
  let chars = ''
  const required: string[] = []

  if (uppercase) {
    chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    required.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
  }
  if (lowercase) {
    chars += 'abcdefghijklmnopqrstuvwxyz'
    required.push('abcdefghijklmnopqrstuvwxyz')
  }
  if (numbers) {
    chars += '0123456789'
    required.push('0123456789')
  }
  if (symbols) {
    chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    required.push('!@#$%^&*()_+-=[]{}|;:,.<>?')
  }

  if (!chars) {
    chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  }

  const result: string[] = []

  for (const req of required) {
    result.push(req[Math.floor(Math.random() * req.length)])
  }

  for (let i = result.length; i < length; i++) {
    result.push(chars[Math.floor(Math.random() * chars.length)])
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result.join('')
}

export function isPasswordExpired(updatedAt: number, cycleDays: number): boolean {
  const now = Date.now()
  const cycleMs = cycleDays * 24 * 60 * 60 * 1000
  return now - updatedAt > cycleMs
}

export function getDaysUntilExpiry(updatedAt: number, cycleDays: number): number {
  const now = Date.now()
  const cycleMs = cycleDays * 24 * 60 * 60 * 1000
  const remaining = cycleMs - (now - updatedAt)
  return Math.ceil(remaining / (24 * 60 * 60 * 1000))
}

export const MOCK_BREACH_DB = [
  { domain: 'example.com', breachDate: '2024-03-15', source: '数据泄露事件A', description: '大规模用户数据泄露，影响超过100万用户' },
  { domain: 'test.com', breachDate: '2024-06-22', source: '数据泄露事件B', description: '服务器被入侵，用户凭证外泄' },
  { domain: 'oldsite.com', breachDate: '2023-11-08', source: '数据泄露事件C', description: '数据库未加密导致信息泄露' },
  { domain: 'social.net', breachDate: '2024-01-30', source: '数据泄露事件D', description: '第三方API漏洞导致用户数据暴露' },
  { domain: 'shop.com', breachDate: '2024-08-12', source: '数据泄露事件E', description: '支付信息与账号数据遭到泄露' },
]

export function checkBreach(url: string): { isBreached: boolean; breachInfo?: { source: string; breachDate: string; description: string } } {
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '')
    const match = MOCK_BREACH_DB.find(b => domain.includes(b.domain) || b.domain.includes(domain))
    if (match) {
      return {
        isBreached: true,
        breachInfo: {
          source: match.source,
          breachDate: match.breachDate,
          description: match.description,
        },
      }
    }
  } catch {
    // invalid URL
  }
  return { isBreached: false }
}
