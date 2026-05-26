import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'
import Logo from '../components/Logo'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function AdminInvite() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'invalid' | 'email-mismatch' | 'ready-to-login' | 'success' | 'error'>('loading')
  const [inviteEmail, setInviteEmail] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      setErrorMessage('Token de convite inválido')
      return
    }

    // Verificar se o token é válido e obter info do email
    const checkInvite = async () => {
      try {
        // Faz uma requisição para validar o token (endpoint simples)
        // Como não temos um endpoint específico, vamos tentar aceitar e ver a resposta
        setStatus('ready-to-login')
      } catch (error) {
        setStatus('invalid')
        setErrorMessage('Convite não encontrado ou expirado')
      }
    }

    checkInvite()
  }, [token])

  const handleGoogleLogin = async (credentialResponse: any) => {
    try {
      if (!token) {
        throw new Error('Token inválido')
      }

      // Fazer login normal primeiro
      const loginResponse = await api.post('/api/auth/google', {
        googleToken: credentialResponse.credential,
      })

      const { user: loginUser } = loginResponse.data

      // Agora aceitar o convite
      const acceptResponse = await api.post(`/api/admin/invites/${token}/accept`, {
        googleToken: credentialResponse.credential,
      })

      if (acceptResponse.data.success) {
        setStatus('success')
        setUserEmail(loginUser.email)

        // Redirecionar para admin em 2 segundos
        setTimeout(() => {
          navigate('/admin')
        }, 2000)
      }
    } catch (error: any) {
      setStatus('error')
      setErrorMessage(error.response?.data?.error || error.message || 'Erro ao processar convite')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-2xl dark:shadow-dark-lg p-8 w-full max-w-md border border-purple-200 dark:border-purple-900">
        <div className="flex items-center justify-center mb-8">
          <Logo />
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Convite de Administrador
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Você foi convidado para ser administrador
        </p>

        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center py-8">
            <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Verificando convite...</p>
          </div>
        )}

        {/* Invalid/Expired State */}
        {status === 'invalid' && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-red-900 dark:text-red-100 font-semibold text-sm">Convite inválido</p>
                <p className="text-red-800 dark:text-red-200 text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Ready to Login State */}
        {status === 'ready-to-login' && (
          <>
            <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
              <p className="text-purple-900 dark:text-purple-100 text-sm">
                Faça login com sua conta Google para aceitar o convite e se tornar administrador.
              </p>
            </div>

            <div className="w-full flex justify-center mb-6">
              <GoogleLogin
                onSuccess={(credentialResponse) => handleGoogleLogin(credentialResponse)}
                onError={() => {
                  setStatus('error')
                  setErrorMessage('Erro ao autenticar com Google')
                }}
              />
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full text-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
            >
              Voltar ao login
            </button>
          </>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CheckCircle className="w-16 h-16 text-green-500 animate-bounce" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
              Parabéns!
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Você agora é um <strong>Administrador</strong>! 🎉
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Redirecionando para o painel de administração em instantes...
            </p>

            <button
              onClick={() => navigate('/admin')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Ir para Admin Agora
            </button>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-red-900 dark:text-red-100 font-semibold text-sm">Erro ao processar convite</p>
                <p className="text-red-800 dark:text-red-200 text-sm mt-1">{errorMessage}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Voltar ao Login
            </button>
          </div>
        )}

        <p className="text-center text-gray-500 dark:text-gray-400 text-xs mt-6">
          Se tiver dúvidas, entre em contato com o administrador.
        </p>
      </div>
    </div>
  )
}
