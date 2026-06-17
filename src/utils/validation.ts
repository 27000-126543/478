export interface ValidationResult {
  valid: boolean
  message: string
}

export function validateWebsite(value: string): ValidationResult {
  if (!value.trim()) return { valid: false, message: '请输入网站或应用名称' }
  if (value.trim().length < 1) return { valid: false, message: '网站名称至少1个字符' }
  if (value.trim().length > 100) return { valid: false, message: '网站名称不能超过100个字符' }
  return { valid: true, message: '' }
}

export function validateUrl(value: string): ValidationResult {
  if (!value.trim()) return { valid: true, message: '' }
  try {
    new URL(value.startsWith('http') ? value : `https://${value}`)
    return { valid: true, message: '' }
  } catch {
    return { valid: false, message: '请输入有效的URL地址' }
  }
}

export function validateUsername(value: string): ValidationResult {
  if (!value.trim()) return { valid: false, message: '请输入用户名或账号' }
  if (value.trim().length < 1) return { valid: false, message: '用户名至少1个字符' }
  if (value.trim().length > 100) return { valid: false, message: '用户名不能超过100个字符' }
  return { valid: true, message: '' }
}

export function validatePassword(value: string): ValidationResult {
  if (!value) return { valid: false, message: '请输入密码' }
  if (value.length < 4) return { valid: false, message: '密码至少4个字符' }
  return { valid: true, message: '' }
}

export function validateMasterPassword(value: string): ValidationResult {
  if (!value) return { valid: false, message: '请输入主密码' }
  if (value.length < 6) return { valid: false, message: '主密码至少6个字符' }
  return { valid: true, message: '' }
}

export function validateEmail(value: string): ValidationResult {
  if (!value.trim()) return { valid: true, message: '' }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) return { valid: false, message: '请输入有效的邮箱地址' }
  return { valid: true, message: '' }
}

export function validatePhone(value: string): ValidationResult {
  if (!value.trim()) return { valid: true, message: '' }
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(value.replace(/\s/g, ''))) return { valid: false, message: '请输入有效的手机号码' }
  return { valid: true, message: '' }
}

export function validateCategoryName(value: string): ValidationResult {
  if (!value.trim()) return { valid: false, message: '请输入分类名称' }
  if (value.trim().length > 20) return { valid: false, message: '分类名称不能超过20个字符' }
  return { valid: true, message: '' }
}

export function validateSecurityAnswer(value: string): ValidationResult {
  if (!value.trim()) return { valid: false, message: '请输入安全问题答案' }
  if (value.trim().length < 2) return { valid: false, message: '答案至少2个字符' }
  return { valid: true, message: '' }
}
