import { useGoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { Wallet } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        setLoading(true)
        setError(null)

        const response = await authAPI.loginWithGoogle(codeResponse.access_token)
        const { accessToken, user } = response.data

        setAuth(accessToken, user)

        if (user.totpEnabled) {
          navigate('/2fa-verify')
        } else {
          navigate('/2fa-setup')
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erro ao fazer login')
        console.error('Login error:', err)
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      setError('Erro ao autenticar com Google')
    },
    flow: 'implicit',
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Wallet className="w-12 h-12 text-primary mr-2" />
          <h1 className="text-3xl font-bold text-gray-900">Omnia</h1>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Controle Financeiro
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Gerencie suas finanças de forma inteligente
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <button
          onClick={() => handleGoogleLogin()}
          disabled={loading}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <span>Autenticando...</span>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Entrar com Google
            </>
          )}
        </button>

        <p className="text-center text-gray-500 text-sm mt-6">
          Ao entrar, você concorda com nossos termos
        </p>
      </div>
    </div>
  )
}
