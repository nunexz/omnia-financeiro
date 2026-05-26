import { useNavigate } from 'react-router-dom'
import { Clock, Mail, ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import Logo from '../components/Logo'

export default function PendingApproval() {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string>('')

  useEffect(() => {
    const savedEmail = localStorage.getItem('pendingUserEmail')
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  const handleClearAndGoBack = () => {
    localStorage.removeItem('pendingUserEmail')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-2xl dark:shadow-dark-lg p-8 w-full max-w-md border border-yellow-200 dark:border-yellow-900">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <Logo />
            <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              ⏳
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Acesso Pendente
        </h1>

        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <Clock className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-yellow-900 dark:text-yellow-100 font-semibold text-sm">
                Seu acesso está em análise
              </p>
              <p className="text-yellow-800 dark:text-yellow-200 text-sm mt-1">
                Um administrador está revisando sua solicitação. Você receberá um email de confirmação assim que for aprovado.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seu Email
            </label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-lg px-4 py-2">
              <Mail size={18} className="text-gray-500 dark:text-gray-400" />
              <input
                type="email"
                value={email}
                disabled
                className="flex-1 bg-transparent text-gray-900 dark:text-white outline-none disabled:cursor-not-allowed text-sm"
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-900 dark:text-blue-100 text-sm">
              <span className="font-semibold">Dica:</span> Verifique sua caixa de entrada (e pasta de spam) para emails de confirmação.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Tentar novamente
          </button>

          <button
            onClick={handleClearAndGoBack}
            className="w-full bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 text-gray-900 dark:text-white font-semibold py-2 rounded-lg transition"
          >
            Voltar ao Login
          </button>
        </div>

        <p className="text-center text-gray-500 dark:text-gray-400 text-xs mt-6">
          Você será notificado assim que seu acesso for aprovado.
          <br />
          Tempo estimado: até 24 horas.
        </p>
      </div>
    </div>
  )
}
