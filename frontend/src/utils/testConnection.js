// Utilitário para testar conexão com o backend
import { API_URL } from '../config'

export const testBackendConnection = async () => {
  console.log('🔍 Testando conexão com backend...')
  console.log('📍 URL:', API_URL)
  
  try {
    const response = await fetch(`${API_URL}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Backend conectado com sucesso!')
      console.log('📦 Resposta:', data)
      return { success: true, data }
    } else {
      console.error('❌ Backend retornou erro:', response.status, response.statusText)
      return { success: false, error: `HTTP ${response.status}` }
    }
  } catch (error) {
    console.error('❌ Erro ao conectar com backend:', error.message)
    console.error('💡 Verifique se o backend está rodando em:', API_URL)
    return { success: false, error: error.message }
  }
}

// Testa automaticamente ao carregar
if (import.meta.env.DEV) {
  testBackendConnection()
}
