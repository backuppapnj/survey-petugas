import axios, { type AxiosError } from 'axios'
import type {
  LoginPayload,
  LoginResponse,
  Petugas,
  SurveiPayload,
  RekapResponse,
  ApiError,
} from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('admin')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export async function getPetugas(id: number): Promise<Petugas> {
  return (await api.get<Petugas>(`/petugas/${id}`)).data
}

export async function submitSurvei(payload: SurveiPayload): Promise<{ message: string }> {
  return (await api.post<{ message: string }>('/survei', payload)).data
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return (await api.post<LoginResponse>('/login', payload)).data
}

export async function getAdminPetugas(): Promise<Petugas[]> {
  return (await api.get<Petugas[]>('/admin/petugas')).data
}

export async function createPetugas(formData: FormData): Promise<Petugas> {
  return (
    await api.post<Petugas>('/admin/petugas', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  ).data
}

/**
 * Update petugas via HTTP method spoofing — kirim POST dengan field _method=PUT
 * karena PHP tidak parse multipart untuk PUT secara native.
 */
export async function updatePetugas(id: number, formData: FormData): Promise<Petugas> {
  formData.append('_method', 'PUT')
  return (
    await api.post<Petugas>(`/admin/petugas/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  ).data
}

export async function deletePetugas(id: number): Promise<{ message: string }> {
  return (await api.delete<{ message: string }>(`/admin/petugas/${id}`)).data
}

export async function getRekap(start: string, end: string): Promise<RekapResponse> {
  return (await api.get<RekapResponse>(`/admin/survei/rekap?start=${start}&end=${end}`)).data
}

export function getExportUrl(start: string, end: string): string {
  return `/api/admin/survei/export?start=${start}&end=${end}`
}

export default api
