import axios from 'axios'
import { API_URL } from '../config'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Log para debug
console.log('📡 API Service configurado com:', API_URL)

// Interceptor para logar erros
api.interceptors.response.use(
  response => response,
  error => {
    console.error('❌ Erro na requisição:', {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    })
    return Promise.reject(error)
  }
)

// Config API
export const getConfig = () => api.get('/api/config')
export const updateLogin = (username, password) => 
  api.post('/api/config/login', { username, password })
export const updateDestination = (path) => 
  api.post('/api/config/destination', { path })
export const updateRescisaoPath = (path) => 
  api.post('/api/config/rescisao-path', { path })

// Columns API
export const getColumns = () => api.get('/api/columns')
export const getReportColumns = (reportName) => 
  api.get(`/api/columns/${encodeURIComponent(reportName)}`)
export const updateColumns = (reportName, columns) => 
  api.post('/api/columns', { report_name: reportName, columns })

// Reports API
export const listReports = () => api.get('/api/reports/list')
export const downloadReport = (reportName, dateRanges) => 
  api.post('/api/reports/download', { 
    report_name: reportName, 
    date_ranges: dateRanges 
  })
export const getDownloadStatus = (taskId) => 
  api.get(`/api/reports/status/${taskId}`)

// Rescisao API
export const uploadNomesFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/api/rescisao/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
export const processRescisao = () => api.post('/api/rescisao/process')

export default api
