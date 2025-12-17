import React, { useState, useEffect, useRef } from 'react'
import { FiX, FiTrash2, FiDownload } from 'react-icons/fi'
import { toast } from 'react-toastify'
import logService from '../services/logService'

const LogsModal = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [filter, setFilter] = useState('all')
  const logsEndRef = useRef(null)
  const logsContainerRef = useRef(null)

  useEffect(() => {
    // Carrega logs existentes
    setLogs(logService.getLogs())

    // Inscreve para receber atualizações em tempo real
    const unsubscribe = logService.subscribe((updatedLogs) => {
      setLogs(updatedLogs)
    })

    // Cleanup
    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const clearLogs = () => {
    logService.clearLogs()
    toast.success('Logs limpos')
  }

  const downloadLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n')
    
    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs_${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Logs baixados')
  }

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true
    return log.level === filter
  })

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'success': return 'text-green-600 bg-green-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Logs do Sistema
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Todos ({logs.length})
              </button>
              <button
                onClick={() => setFilter('info')}
                className={`px-3 py-1 text-sm rounded ${filter === 'info' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Info
              </button>
              <button
                onClick={() => setFilter('success')}
                className={`px-3 py-1 text-sm rounded ${filter === 'success' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Sucesso
              </button>
              <button
                onClick={() => setFilter('warning')}
                className={`px-3 py-1 text-sm rounded ${filter === 'warning' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Avisos
              </button>
              <button
                onClick={() => setFilter('error')}
                className={`px-3 py-1 text-sm rounded ${filter === 'error' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Erros
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="mr-2"
                />
                Auto-scroll
              </label>
              <button
                onClick={downloadLogs}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title="Baixar logs"
              >
                <FiDownload size={18} />
              </button>
              <button
                onClick={clearLogs}
                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                title="Limpar logs"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          </div>

          {/* Logs Content */}
          <div 
            ref={logsContainerRef}
            className="px-6 py-4 bg-gray-900 overflow-y-auto"
            style={{ height: '650px'}}
          >
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Nenhum log para exibir
              </div>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-start space-x-2">
                    <span className="text-gray-500">[{log.timestamp}]</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-gray-300 flex-1">{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-600">
              {filteredLogs.length} log(s) exibido(s)
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogsModal
