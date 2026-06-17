import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from '@/store'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Vault from '@/pages/Vault'
import PasswordManager from '@/pages/PasswordManager'
import Generator from '@/pages/Generator'
import Categories from '@/pages/Categories'
import BreachDetect from '@/pages/BreachDetect'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import { useEffect } from 'react'
import { evaluatePasswordStrength } from '@/utils/password'
import { checkBreach } from '@/utils/password'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore(s => s.isAuthenticated)
  const settings = useStore(s => s.settings)
  const location = useLocation()
  const isRegistered = !!settings.masterPasswordHash

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  if (!isRegistered) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return <>{children}</>
}

function LoginRedirect() {
  const isAuthenticated = useStore(s => s.isAuthenticated)
  const settings = useStore(s => s.settings)
  const isRegistered = !!settings.masterPasswordHash

  if (isAuthenticated && isRegistered) {
    return <Navigate to="/vault" replace />
  }

  return <Login />
}

function DataInitializer() {
  const entries = useStore(s => s.entries)
  const updateEntry = useStore(s => s.updateEntry)

  useEffect(() => {
    entries.forEach(entry => {
      if (!entry.strengthScore || entry.strengthScore === 0) {
        const result = evaluatePasswordStrength(entry.password)
        const breachResult = checkBreach(entry.url)
        updateEntry(entry.id, {
          strength: result.level,
          strengthScore: result.score,
          isBreached: breachResult.isBreached,
          breachInfo: breachResult.breachInfo,
        })
      }
    })
  }, [])

  return null
}

export default function App() {
  return (
    <Router>
      <DataInitializer />
      <Routes>
        <Route path="/" element={<LoginRedirect />} />
        <Route element={<AuthGuard><Layout /></AuthGuard>}>
          <Route path="/vault" element={<Vault />} />
          <Route path="/vault/add" element={<PasswordManager />} />
          <Route path="/vault/edit/:id" element={<PasswordManager />} />
          <Route path="/generator" element={<Generator />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/breach-detect" element={<BreachDetect />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/vault" replace />} />
      </Routes>
    </Router>
  )
}
