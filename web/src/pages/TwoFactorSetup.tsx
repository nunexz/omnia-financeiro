import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import QRCode from 'qrcode.react'
import { Copy, Check } from 'lucide-react'

export default function TwoFactorSetup() {
  const navigate = useNavigate()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const setupTwoFactor = async () => {
      try {
        const response = await authAPI.setup2FA()
        const { secret: qrCodeValue, secret: secretValue } = response.data
        setQrCode(qrCodeValue)
        setSecret(secretValue)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erro ao configurar 2FA')
      } finally {
        setLoading(false)
      }
    }

    setupTwoFactor()
  }, [])

  const copyToClipboard = () => {
    if (secret) {
      navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSkip = () => {
    navigate('/dashboard')
  }

  const handleSetupComplete = () => {
    navigate('/2fa-verify')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white text-xl">Gerando código QR...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 transition-colors flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-2xl dark:shadow-dark-lg p-8 w-full max-w-md border border-gray-200 dark:border-dark-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Autenticação de Dois Fatores
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Escaneie o código QR com seu autenticador (Google Authenticator, Microsoft Authenticator, etc)
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {qrCode && (
          <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg mb-6 flex justify-center">
            <QRCode value={qrCode} size={200} />
          </div>
        )}

        <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Chave de backup (guarde em segurança):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white dark:bg-dark-800 p-2 rounded font-mono text-sm break-all text-gray-900 dark:text-gray-100">
              {secret}
            </code>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded transition"
              title="Copiar"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSkip}
            className="flex-1 bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-dark-600 transition"
          >
            Pular por enquanto
          </button>
          <button
            onClick={handleSetupComplete}
            className="flex-1 bg-primary-600 dark:bg-primary-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  )
}
