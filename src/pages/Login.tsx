import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { Shield, Eye, EyeOff, Lock, ArrowRight } from 'lucide-react'
import { validateMasterPassword } from '@/utils/validation'
import { motion } from 'framer-motion'

export default function Login() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const login = useStore(s => s.login)
  const register = useStore(s => s.register)
  const settings = useStore(s => s.settings)
  const navigate = useNavigate()

  const isRegistered = !!settings.masterPasswordHash

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateMasterPassword(password)
    if (!validation.valid) {
      setError(validation.message)
      return
    }

    if (isRegistered) {
      const success = login(password)
      if (success) {
        navigate('/vault')
      } else {
        setError('主密码错误，请重试')
      }
    } else {
      register(password)
      navigate('/vault')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] bg-grid relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[var(--accent-green)]/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[var(--accent-blue)]/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="glass-card p-8">
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-2xl gradient-green flex items-center justify-center mb-4 glow-green"
            >
              <Shield className="w-8 h-8 text-[#0A0E27]" />
            </motion.div>
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">SafeVault</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              {isRegistered ? '输入主密码解锁' : '创建主密码开始使用'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                主密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder={isRegistered ? '请输入主密码' : '设置主密码（至少6位）'}
                  className={`input-dark pl-11 pr-11 ${error ? 'error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[var(--accent-red)] text-xs mt-2"
                >
                  {error}
                </motion.p>
              )}
            </div>

            {!isRegistered && password.length >= 6 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="glass-card p-3"
              >
                <p className="text-xs text-[var(--text-muted)]">
                  ⚠️ 请牢记您的主密码，它是解锁密码库的唯一凭证。忘记主密码需通过安全问题或紧急联系人重置。
                </p>
              </motion.div>
            )}

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isRegistered ? '解锁' : '创建密码库'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {isRegistered && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors"
              >
                忘记主密码？通过安全问题重置
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          所有数据均加密存储在本地，不会上传至任何服务器
        </p>
      </motion.div>
    </div>
  )
}
