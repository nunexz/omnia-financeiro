import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect, useState } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TwoFactorSetup from './pages/TwoFactorSetup'
import TwoFactorVerify from './pages/TwoFactorVerify'

function App() {
  const { token } = useAuthStore()
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!token ? <Login isDark={isDark} setIsDark={setIsDark} /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/2fa-setup"
          element={token ? <TwoFactorSetup isDark={isDark} setIsDark={setIsDark} /> : <Navigate to="/login" />}
        />
        <Route
          path="/2fa-verify"
          element={token ? <TwoFactorVerify isDark={isDark} setIsDark={setIsDark} /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard"
          element={token ? <Dashboard isDark={isDark} setIsDark={setIsDark} /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
