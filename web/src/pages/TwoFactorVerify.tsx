import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function TwoFactorVerify() {
  const navigate = useNavigate()
  const setTotpEnabled = useAuthStore((state) => state.setTotpEnabled)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (code.length !== 6) {
      setError('O código deve ter 6 dígitos')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await authAPI.verify2FA(code)
      setTotpEnabled(true)

      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código inválido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verificar Código
        </h2>
        <p className="text-gray-600 mb-6">
          Digite o código de 6 dígitos do seu autenticador
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none font-mono"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>

        <button
          onClick={() => navigate('/login')}
          className="w-full mt-4 text-primary hover:text-yellow-500 font-semibold py-2"
        >
          Voltar ao login
        </button>
      </div>
    </div>
  )
}
