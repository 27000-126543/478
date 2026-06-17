import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import {
  Shield,
  Key,
  FolderOpen,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react'

const navItems = [
  { to: '/vault', icon: Key, label: '密码库' },
  { to: '/generator', icon: Zap, label: '生成器' },
  { to: '/categories', icon: FolderOpen, label: '分类' },
  { to: '/breach-detect', icon: AlertTriangle, label: '泄露检测' },
  { to: '/reports', icon: BarChart3, label: '安全报告' },
  { to: '/settings', icon: Settings, label: '设置' },
]

export default function Layout() {
  const logout = useStore(s => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      <aside className="hidden md:flex w-64 flex-col border-r border-[var(--border-glass)] bg-[var(--bg-secondary)]/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#0A0E27]" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-[var(--text-primary)]">SafeVault</h1>
            <p className="text-xs text-[var(--text-muted)]">密码安全管理</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'gradient-green text-[#0A0E27]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent-red)] hover:bg-[var(--bg-card)] transition-all duration-200 w-full"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-grid">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--border-glass)] bg-[var(--bg-secondary)]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="w-8 h-8 rounded-lg gradient-green flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#0A0E27]" />
          </div>
          <span className="font-display font-bold text-sm">SafeVault</span>
        </div>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
        <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around bg-[var(--bg-secondary)]/90 backdrop-blur-xl border-t border-[var(--border-glass)] py-2 z-50">
          {navItems.slice(0, 5).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs transition-all ${
                  isActive ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)]'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </main>
    </div>
  )
}
