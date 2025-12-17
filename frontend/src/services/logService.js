import { API_URL } from '../config'

class LogService {
  constructor() {
    this.logs = []
    this.listeners = []
    this.polling = null
    this.lastLogId = 0
    this.processedLogIds = new Set() // Rastreia logs já processados
  }

  // Inicia polling de logs em background
  startPolling() {
    if (this.polling) return // Já está rodando

    this.polling = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/logs`)
        const data = await response.json()
        
        if (data.logs && data.logs.length > 0) {
          data.logs.forEach(log => {
            // Cria ID único baseado em timestamp + mensagem
            const logId = `${log.timestamp}_${log.message}`
            
            // Só adiciona se não foi processado ainda
            if (!this.processedLogIds.has(logId)) {
              this.processedLogIds.add(logId)
              this.addLog(log.level, log.message, log.timestamp)
              
              // Limita tamanho do Set para não crescer infinitamente
              if (this.processedLogIds.size > 2000) {
                const firstItem = this.processedLogIds.values().next().value
                this.processedLogIds.delete(firstItem)
              }
            }
          })
        }
      } catch (error) {
        // Silenciosamente ignora erros de polling
        console.error('Erro ao buscar logs:', error)
      }
    }, 2000) // Poll a cada 2 segundos
  }

  // Para polling
  stopPolling() {
    if (this.polling) {
      clearInterval(this.polling)
      this.polling = null
    }
  }

  // Adiciona log
  addLog(level, message, timestamp = null) {
    const newLog = {
      id: ++this.lastLogId,
      timestamp: timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
      level,
      message
    }
    
    this.logs.push(newLog)
    
    // Limita a 1000 logs para não sobrecarregar memória
    if (this.logs.length > 1000) {
      this.logs.shift()
    }
    
    // Notifica listeners
    this.notifyListeners()
  }

  // Registra listener
  subscribe(callback) {
    this.listeners.push(callback)
    
    // Retorna função para cancelar inscrição
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  // Notifica todos os listeners
  notifyListeners() {
    this.listeners.forEach(callback => {
      callback([...this.logs])
    })
  }

  // Retorna todos os logs
  getLogs() {
    return [...this.logs]
  }

  // Limpa logs
  clearLogs() {
    this.logs = []
    this.notifyListeners()
  }
}

// Singleton
const logService = new LogService()

// Inicia polling automaticamente
logService.startPolling()

export default logService
