import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, ChevronDown } from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '../services/api'

export default function Admin() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, logout } = useAuthStore()
  const [isDark, setIsDarkState] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [suspendReason, setSuspendReason] = useState<{ [key: string]: string }>({})
  const [selectedTab, setSelectedTab] = useState<'pending' | 'active' | 'suspended' | 'all'>('all')
  const [inviteEmail, setInviteEmail] = useState<string>('')
  const [showInviteForm, setShowInviteForm] = useState<boolean>(false)

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get('/api/admin/users')
      return Array.isArray(response.data) ? response.data : []
    },
  })

  const toggleAdminMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/api/admin/users/${userId}/toggle-admin`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const approveMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/api/admin/users/${userId}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/api/admin/users/${userId}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const suspendMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      api.patch(`/api/admin/users/${userId}/suspend`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setSuspendReason({})
    },
  })

  const unsuspendMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/api/admin/users/${userId}/unsuspend`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const sendInviteMutation = useMutation({
    mutationFn: (email: string) => api.post('/api/admin/invites', { email }),
    onSuccess: () => {
      setInviteEmail('')
      setShowInviteForm(false)
      alert('Convite enviado com sucesso!')
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Erro ao enviar convite')
    },
  })

  const [extendTrialUserId, setExtendTrialUserId] = useState<string | null>(null)
  const [extendTrialDays, setExtendTrialDays] = useState<number>(7)

  const extendTrialMutation = useMutation({
    mutationFn: ({ userId, days }: { userId: string; days: number }) =>
      api.patch(`/api/admin/users/${userId}/extend-trial`, { days }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setExtendTrialUserId(null)
      setExtendTrialDays(7)
      alert('Trial estendido com sucesso!')
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Erro ao estender trial')
    },
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
      case 'pending_approval':
        return isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
      case 'suspended':
        return isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
      default:
        return isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'pending_approval':
        return 'Pendente'
      case 'suspended':
        return 'Suspenso'
      default:
        return status
    }
  }

  const filteredUsers = (users as any).filter((u: any) => {
    if (selectedTab === 'all') return true
    return u.status === selectedTab
  })

  if (!user?.is_admin) {
    return (
      <div className={isDark ? 'dark' : ''}>
        <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
          <div className="text-center">
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Acesso negado - Admin only</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className={`min-h-screen ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
        <Navbar isDark={isDark} toggleDarkMode={toggleDarkMode} userName={user?.nome || 'Usuário'} onLogout={handleLogout} trialEndsAt={user?.trialEndsAt} />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Gerenciar Usuários</h2>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {['all', 'pending', 'active', 'suspended'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab as any)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedTab === tab
                    ? isDark
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-500 text-white'
                    : isDark
                    ? 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tab === 'pending_approval' ? 'Pendentes' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Users List */}
          <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg shadow overflow-x-auto`}>
            <table className="w-full min-w-max">
              <thead>
                <tr className={`border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                  <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Nome</th>
                  <th className={`text-left py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email</th>
                  <th className={`text-center py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</th>
                  <th className={`text-center py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Admin</th>
                  <th className={`text-center py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Data Criação</th>
                  <th className={`text-center py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Trial Expira</th>
                  <th className={`text-center py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {(filteredUsers as any).map((u: any) => (
                  <tr key={u.id} className={`border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                    <td className={`py-4 px-6 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{u.nome}</td>
                    <td className={`py-4 px-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{u.email}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(u.status)}`}>
                        {getStatusLabel(u.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {u.is_admin ? (
                        <Shield className="w-5 h-5 text-orange-500 mx-auto" />
                      ) : (
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
                      )}
                    </td>
                    <td className={`py-4 px-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className={`py-4 px-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {u.trialEndsAt ? (
                        <div>
                          <span>{new Date(u.trialEndsAt).toLocaleDateString('pt-BR')}</span>
                          <br />
                          {u.status === 'active' && !new Date(u.trialEndsAt).getTime() <= Date.now() && (
                            <button
                              onClick={() => setExtendTrialUserId(u.id)}
                              className={`text-xs mt-1 px-2 py-1 rounded ${isDark ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'}`}
                            >
                              Estender
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className={isDark ? 'text-green-400' : 'text-green-600'}>✓ Liberado</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex gap-2 justify-center flex-wrap">
                        <button
                          onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                          className={`p-1 rounded transition ${isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-100'}`}
                          title="Ver dados"
                        >
                          <ChevronDown className={`w-4 h-4 transition ${expandedUser === u.id ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Status Actions */}
                        {u.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate(u.id)}
                              disabled={approveMutation.isPending}
                              className="px-2 py-1 text-sm rounded bg-green-600 hover:bg-green-700 text-white transition"
                              title="Aprovar"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(u.id)}
                              disabled={rejectMutation.isPending}
                              className="px-2 py-1 text-sm rounded bg-red-600 hover:bg-red-700 text-white transition"
                              title="Rejeitar"
                            >
                              ✕
                            </button>
                          </>
                        )}

                        {u.status === 'active' && u.id !== user?.id && (
                          <>
                            <button
                              onClick={() => toggleAdminMutation.mutate(u.id)}
                              disabled={toggleAdminMutation.isPending}
                              className={`px-2 py-1 text-sm rounded transition ${
                                u.is_admin
                                  ? `${isDark ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-800 hover:bg-red-200'}`
                                  : `${isDark ? 'bg-green-900 text-green-200 hover:bg-green-800' : 'bg-green-100 text-green-800 hover:bg-green-200'}`
                              }`}
                            >
                              {u.is_admin ? 'Remover' : 'Promover'}
                            </button>

                            {/* Suspend Button */}
                            <div className="relative group">
                              <button className="px-2 py-1 text-sm rounded bg-yellow-600 hover:bg-yellow-700 text-white transition">
                                ⚠
                              </button>
                              <div
                                className={`hidden group-hover:block absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg z-10 ${
                                  isDark ? 'bg-dark-700 border border-dark-600' : 'bg-white border border-gray-200'
                                } p-3`}
                              >
                                <input
                                  type="text"
                                  placeholder="Motivo da suspensão"
                                  value={suspendReason[u.id] || ''}
                                  onChange={(e) =>
                                    setSuspendReason({
                                      ...suspendReason,
                                      [u.id]: e.target.value,
                                    })
                                  }
                                  className={`w-full px-2 py-1 text-sm rounded mb-2 border ${
                                    isDark
                                      ? 'bg-dark-600 border-dark-500 text-white'
                                      : 'bg-gray-50 border-gray-300 text-gray-900'
                                  }`}
                                />
                                <button
                                  onClick={() =>
                                    suspendMutation.mutate({
                                      userId: u.id,
                                      reason: suspendReason[u.id] || 'Suspensão administrativa',
                                    })
                                  }
                                  disabled={suspendMutation.isPending}
                                  className="w-full px-2 py-1 text-sm rounded bg-red-600 hover:bg-red-700 text-white transition"
                                >
                                  Suspender
                                </button>
                              </div>
                            </div>
                          </>
                        )}

                        {u.status === 'suspended' && u.id !== user?.id && (
                          <button
                            onClick={() => unsuspendMutation.mutate(u.id)}
                            disabled={unsuspendMutation.isPending}
                            className="px-2 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white transition"
                          >
                            Reativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Nenhum usuário encontrado com este status
            </div>
          )}

          {/* Admin Invite Section */}
          <div className="mt-12">
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
              Convidar Novo Administrador
            </h3>

            {!showInviteForm ? (
              <button
                onClick={() => setShowInviteForm(true)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
              >
                + Enviar Convite
              </button>
            ) : (
              <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg shadow p-6 max-w-md`}>
                <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Email para Convidar
                </label>

                <input
                  type="email"
                  placeholder="novo-admin@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border mb-4 ${
                    isDark
                      ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => sendInviteMutation.mutate(inviteEmail)}
                    disabled={!inviteEmail || sendInviteMutation.isPending}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
                  >
                    {sendInviteMutation.isPending ? 'Enviando...' : 'Enviar Convite'}
                  </button>

                  <button
                    onClick={() => {
                      setShowInviteForm(false)
                      setInviteEmail('')
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                      isDark
                        ? 'bg-dark-700 hover:bg-dark-600 text-gray-300'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>

                <p className={`text-xs mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Um email com o link de convite será enviado para este endereço. O convite expira em 7 dias.
                </p>
              </div>
            )}
          </div>

          {/* Extend Trial Modal */}
          {extendTrialUserId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg shadow-xl p-6 max-w-md w-full`}>
                <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Estender Trial
                </h3>

                <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Quantos dias?
                </label>

                <input
                  type="number"
                  min="1"
                  max="365"
                  value={extendTrialDays}
                  onChange={(e) => setExtendTrialDays(parseInt(e.target.value))}
                  className={`w-full px-4 py-2 rounded-lg border mb-4 ${
                    isDark
                      ? 'bg-dark-700 border-dark-600 text-white'
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => extendTrialMutation.mutate({ userId: extendTrialUserId, days: extendTrialDays })}
                    disabled={extendTrialMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
                  >
                    {extendTrialMutation.isPending ? 'Estendendo...' : 'Estender'}
                  </button>

                  <button
                    onClick={() => setExtendTrialUserId(null)}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                      isDark
                        ? 'bg-dark-700 hover:bg-dark-600 text-gray-300'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Suspend Reason Display */}
          {(users as any)
            .filter((u: any) => u.status === 'suspended' && u.suspendReason)
            .map((u: any) => (
              <div key={u.id} className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-red-900 bg-opacity-20' : 'bg-red-50'} border ${isDark ? 'border-red-800' : 'border-red-200'}`}>
                <p className={`text-sm ${isDark ? 'text-red-200' : 'text-red-700'}`}>
                  <strong>{u.nome}</strong> suspenso por: {u.suspendReason}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
