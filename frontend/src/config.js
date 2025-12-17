// Configuração dinâmica de API URL
const getApiUrl = () => {
  // Pega o hostname atual (pode ser localhost ou IP da máquina)
  const hostname = window.location.hostname
  
  // Se hostname for vazio ou inválido, usa localhost como fallback
  const host = hostname || 'localhost'
  
  // IMPORTANTE: Backend sempre roda na porta 8000
  // Frontend pode rodar em qualquer porta (5173, 3002, etc.)
  // Mas o backend é SEMPRE :8000
  return `http://${host}:8000`
}

export const API_URL = getApiUrl()

// Para debug - mostra no console
console.log('🔗 API URL configurada:', API_URL)
console.log('🌐 Frontend hostname:', window.location.hostname)
console.log('🔌 Frontend port:', window.location.port)
console.log('⚠️  ATENÇÃO: Backend deve estar rodando na porta 8000!')
console.log('💡 Verifique: python backend/main.py')
