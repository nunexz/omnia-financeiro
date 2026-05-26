import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  loginWithGoogle: (googleToken: string) =>
    api.post('/api/auth/google', { googleToken }),

  setup2FA: () =>
    api.post('/api/auth/2fa/setup'),

  verify2FA: (token: string) =>
    api.post('/api/auth/2fa/verify', { token }),
}

export const dashboardAPI = {
  getDashboard: (mesAno: string) =>
    api.get(`/api/dashboard/${mesAno}`),
}

export const rendasAPI = {
  getRenda: (mesAno: string) =>
    api.get(`/api/rendas/${mesAno}`),

  createRenda: (data: any) =>
    api.post('/api/rendas', data),

  updateRenda: (id: string, data: any) =>
    api.put(`/api/rendas/${id}`, data),

  deleteRenda: (id: string) =>
    api.delete(`/api/rendas/${id}`),

  adicionar13Automatico: (data: any) =>
    api.post('/api/rendas/adicionar-13-automatico', data),
}

export const gastosFixosAPI = {
  getGastos: (mesAno: string) =>
    api.get(`/api/gastos-fixos/${mesAno}`),

  createGasto: (data: any) =>
    api.post('/api/gastos-fixos', data),

  updateGasto: (id: string, data: any) =>
    api.put(`/api/gastos-fixos/${id}`, data),

  deleteGasto: (id: string) =>
    api.delete(`/api/gastos-fixos/${id}`),

  marcarPago: (id: string, pago: boolean) =>
    api.patch(`/api/gastos-fixos/${id}/marcar-pago`, { pago }),
}

export const dividasAPI = {
  getDividas: (mesAno: string) =>
    api.get(`/api/dividas/${mesAno}`),

  createDivida: (data: any) =>
    api.post('/api/dividas', data),

  updateDivida: (id: string, data: any) =>
    api.put(`/api/dividas/${id}`, data),

  deleteDivida: (id: string) =>
    api.delete(`/api/dividas/${id}`),

  marcarPago: (id: string, pago: boolean) =>
    api.patch(`/api/dividas/${id}/marcar-pago`, { pago }),

  registrarAntecipacao: (id: string, parcelas_adicionais: number) =>
    api.patch(`/api/dividas/${id}/antecipacao`, { parcelas_adicionais }),

  quitarDivida: (id: string) =>
    api.patch(`/api/dividas/${id}/quitar`),
}

export const gastosVariaveisAPI = {
  getGastos: (mesAno: string) =>
    api.get(`/api/gastos-variaveis/${mesAno}`),

  createGasto: (data: any) =>
    api.post('/api/gastos-variaveis', data),

  updateGasto: (id: string, data: any) =>
    api.put(`/api/gastos-variaveis/${id}`, data),

  deleteGasto: (id: string) =>
    api.delete(`/api/gastos-variaveis/${id}`),
}

export const investimentosAPI = {
  getInvestimentos: (mesAno: string) =>
    api.get(`/api/investimentos/${mesAno}`),

  addInvestimento: (data: any) =>
    api.post('/api/investimentos', data),

  editInvestimento: (id: string, data: any) =>
    api.put(`/api/investimentos/${id}`, data),

  deleteInvestimento: (id: string) =>
    api.delete(`/api/investimentos/${id}`),
}

export const exportImportAPI = {
  exportJSON: (mesAno: string) =>
    api.get(`/api/export/json`, { params: { mesAno } }),

  importJSON: (data: any) =>
    api.post('/api/export/json', data),
}

export const copyDataAPI = {
  copyFromPreviousMonth: (mesAno: string) =>
    api.post('/api/copy-data/from-previous-month', { mesAno }),
  clearMonth: (mesAno: string) =>
    api.delete('/api/copy-data/clear-month', { data: { mesAno } }),
}

export default api
