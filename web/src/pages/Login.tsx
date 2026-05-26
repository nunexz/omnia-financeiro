import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { Moon, Sun } from 'lucide-react'
import Logo from '../components/Logo'

interface LoginProps {
  isDark?: boolean
  setIsDark?: (value: boolean) => void
}

export default function Login({ isDark = false, setIsDark }: LoginProps) {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 transition-colors flex items-center justify-center p-4 relative">
      {/* Dark mode toggle */}
      <button
        onClick={() => setIsDark?.(!isDark)}
        className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 transition"
        title={isDark ? 'Modo Claro' : 'Modo Escuro'}
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-yellow-500" />
        ) : (
          <Moon className="w-5 h-5 text-gray-600" />
        )}
      </button>

      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-2xl dark:shadow-dark-lg p-8 w-full max-w-md border border-gray-200 dark:border-dark-700">
        <div className="flex items-center justify-center mb-8">
          <Logo />
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Controle Financeiro
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Gerencie suas finanças de forma inteligente
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="w-full flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                setError(null)

                if (!credentialResponse.credential) {
                  throw new Error('Nenhum token recebido do Google')
                }

                console.log('Google login successful, sending token to backend...')
                const response = await authAPI.loginWithGoogle(credentialResponse.credential)
                const { accessToken, user, requiresApproval } = response.data

                // Se usuário está pendente de aprovação, não fazer login
                if (requiresApproval) {
                  localStorage.setItem('pendingUserEmail', user.email)
                  navigate('/pending-approval')
                  return
                }

                setAuth(accessToken, user)

                if (user.totpEnabled) {
                  navigate('/2fa-verify')
                } else {
                  navigate('/2fa-setup')
                }
              } catch (err: any) {
                console.error('Login error:', err)
                setError(err.response?.data?.error || err.message || 'Erro ao fazer login')
              }
            }}
            onError={() => {
              setError('Erro ao autenticar com Google')
              console.error('Google login failed')
            }}
          />
        </div>

        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
          Ao entrar, você concorda com nossos termos
        </p>
      </div>
    </div>
  )
}
