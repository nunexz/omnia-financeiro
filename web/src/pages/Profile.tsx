import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LogOut, Sun, Moon, ArrowLeft, Shield } from 'lucide-react'
import Logo from '../components/Logo'
import Navbar from '../components/Navbar'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [isDark, setIsDarkState] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleDarkMode = () => {
    const newValue = !isDark
    setIsDarkState(newValue)
    const root = document.documentElement
    if (newValue) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        <Navbar isDark={isDark} toggleDarkMode={toggleDarkMode} userName={user?.nome || 'Usuário'} onLogout={handleLogout} trialEndsAt={user?.trialEndsAt} />

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-white mb-8">Meu Perfil</h1>

          {/* User Info Card */}
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-8 mb-8">
            {/* Avatar */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-dark-700">
              {user?.foto ? (
                <img
                  src={user.foto}
                  alt={user.nome}
                  className="w-20 h-20 rounded-full border-2 border-orange-500"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user?.nome?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">{user?.nome}</h2>
                <p className="text-gray-400">{user?.email}</p>
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Email</label>
                <p className="text-white text-lg">{user?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Nome Completo</label>
                <p className="text-white text-lg">{user?.nome}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Autenticação em Dois Fatores</label>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${user?.totpSecret ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-white">
                    {user?.totpSecret ? '✓ Ativado' : '⚠ Não configurado'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Status de Admin</label>
                <div className="flex items-center gap-3">
                  {user?.is_admin ? (
                    <>
                      <Shield size={20} className="text-blue-400" />
                      <span className="text-white">Administrador</span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded border border-gray-600 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                      </div>
                      <span className="text-white">Usuário Comum</span>
                    </>
                  )}
                </div>
              </div>

              {user?.trialEndsAt && (
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Status do Trial</label>
                  {(() => {
                    const trialDate = new Date(user.trialEndsAt);
                    const today = new Date();
                    const daysLeft = Math.ceil((trialDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    if (daysLeft > 0) {
                      return (
                        <div className={`p-3 rounded-lg border ${
                          daysLeft <= 3
                            ? 'bg-red-950 border-red-800'
                            : daysLeft <= 7
                            ? 'bg-yellow-950 border-yellow-800'
                            : 'bg-green-950 border-green-800'
                        }`}>
                          <p className={`font-semibold ${
                            daysLeft <= 3
                              ? 'text-red-200'
                              : daysLeft <= 7
                              ? 'text-yellow-200'
                              : 'text-green-200'
                          }`}>
                            📅 Você tem <strong>{daysLeft}</strong> dia{daysLeft !== 1 ? 's' : ''} de trial
                          </p>
                          <p className="text-sm text-gray-300 mt-1">
                            Expira em: <strong>{trialDate.toLocaleDateString('pt-BR')}</strong>
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Entre em contato com o administrador para liberar acesso permanente.
                          </p>
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-3 rounded-lg bg-green-950 border border-green-800">
                          <p className="font-semibold text-green-200">
                            ✅ Acesso Liberado
                          </p>
                          <p className="text-sm text-gray-300 mt-1">
                            Seu período de trial terminou, mas você foi aprovado por um administrador.
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-8 border-t border-dark-700 flex gap-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
              >
                <LogOut size={20} />
                Sair
              </button>
            </div>
          </div>

          {/* Additional Info */}
          {user?.is_admin && (
            <div className="bg-dark-800 rounded-lg border border-blue-900 p-8 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Shield size={24} className="text-blue-400" />
                <h3 className="text-xl font-bold text-white">Acesso Admin</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Você tem acesso ao painel administrativo. Pode gerenciar usuários e visualizar dados.
              </p>
              <button
                onClick={() => navigate('/admin')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                Ir para Admin
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
