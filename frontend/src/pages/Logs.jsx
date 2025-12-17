import React, { useState, useEffect, useRef } from 'react'
import { FiRefreshCw, FiTrash2, FiDownload } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { API_URL } from '../config'

const Logs = () => {
  const [logs, setLogs] = useState([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [filter, setFilter] = useState('all') // all, info, error, warning
  const logsEndRef = useRef(null)
  const logsContainerRef = useRef(null)

  useEffect(() => {
    // Simular logs iniciais
    addLog('info', 'Sistema iniciado')
    addLog('info', 'Aguardando ações do usuário...')

    // Polling para buscar logs do backend
    const pollLogs = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/logs`)
        const data = await response.json()
        
        if (data.logs && data.logs.length > 0) {
          data.logs.forEach(log => {
            addLog(log.level, log.message)
          })
        }
      } catch (error) {
        // Silenciosamente ignora erros de polling
      }
    }, 2000) // A cada 2 segundos

    return () => clearInterval(pollLogs)
  }, [])

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const addLog = (level, message) => {
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level,
      message
    }
    setLogs(prev => [...prev, newLog])
  }

  // Expor função globalmente para outros componentes adicionarem logs
  useEffect(() => {
    window.addLog = addLog
    return () => {
      delete window.addLog
    }
  }, [])

  const clearLogs = () => {
    if (window.confirm('Limpar todos os logs?')) {
      setLogs([])
      toast.info('Logs limpos')
    }
  }

  const exportLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n')

    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    toast.success('Logs exportados')
  }

  const getLogIcon = (level) => {
    switch (level) {
      case 'info': return 'ℹ️'
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      default: return '📝'
    }
  }

  const getLogColor = (level) => {
    switch (level) {
      case 'info': return 'text-blue-700 bg-blue-50 border-blue-200'
      case 'success': return 'text-green-700 bg-green-50 border-green-200'
      case 'warning': return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      case 'error': return 'text-red-700 bg-red-50 border-red-200'
      default: return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Auto-scroll
            </label>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todos os logs</option>
              <option value="info">Info</option>
              <option value="success">Sucesso</option>
              <option value="warning">Avisos</option>
              <option value="error">Erros</option>
            </select>

            <span className="text-sm text-gray-600">
              {filteredLogs.length} {filteredLogs.length === 1 ? 'log' : 'logs'}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportLogs}
              disabled={logs.length === 0}
              className="flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
            >
              <FiDownload className="mr-2" size={16} />
              Exportar
            </button>
            <button
              onClick={clearLogs}
              disabled={logs.length === 0}
              className="flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
            >
              <FiTrash2 className="mr-2" size={16} />
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Logs Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Logs do Sistema
          </h2>
        </div>

        <div
          ref={logsContainerRef}
          className="p-4 h-[600px] overflow-y-auto bg-gray-900 font-mono text-sm"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum log para exibir</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded border ${getLogColor(log.level)}`}
                >
                  <span className="text-gray-600 mr-2">[{log.timestamp}]</span>
                  <span className="mr-2">{getLogIcon(log.level)}</span>
                  <span>{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
        <div className="flex items-start">
          <span className="text-blue-600 text-xl mr-3">💡</span>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Sobre os Logs</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Os logs são atualizados em tempo real</li>
              <li>Use o filtro para ver apenas logs específicos</li>
              <li>Exporte os logs para análise posterior</li>
              <li>Auto-scroll mantém os logs mais recentes visíveis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Logs
