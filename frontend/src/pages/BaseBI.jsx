import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { FiDownload, FiRefreshCw, FiDatabase, FiCheckSquare, FiSquare } from 'react-icons/fi'
import axios from 'axios'
import { API_URL } from '../config'

const BaseBI = () => {
  const [files, setFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [lastMergeResult, setLastMergeResult] = useState(null)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/bi/files`)
      setFiles(response.data.files || [])
      // Seleciona todos por padrão
      setSelectedFiles(response.data.files.map(f => f.relative_path))
    } catch (error) {
      toast.error('Erro ao carregar arquivos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleFileSelection = (relativePath) => {
    setSelectedFiles(prev => {
      if (prev.includes(relativePath)) {
        return prev.filter(f => f !== relativePath)
      } else {
        return [...prev, relativePath]
      }
    })
  }

  const toggleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(files.map(f => f.relative_path))
    }
  }

  const handleMerge = async () => {
    if (selectedFiles.length === 0) {
      toast.warning('Selecione pelo menos um arquivo para mesclar')
      return
    }

    setProcessing(true)
    setProgress(0)
    setProgressMessage('Iniciando consolidação...')
    
    try {
      // Filtra apenas os arquivos selecionados
      const selectedFileObjects = files.filter(f => selectedFiles.includes(f.relative_path))
      
      // Simula progresso enquanto processa
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev
          return prev + 5
        })
      }, 500)
      
      const response = await axios.post(`${API_URL}/api/bi/merge`, {
        selected_files: selectedFileObjects
      })
      
      clearInterval(progressInterval)
      setProgress(100)
      setProgressMessage('Consolidação concluída!')

      if (response.data.success) {
        setLastMergeResult(response.data)
        toast.success(response.data.message)
      } else {
        toast.warning(response.data.message)
      }
    } catch (error) {
      setProgress(0)
      setProgressMessage('')
      toast.error('Erro ao mesclar dados: ' + error.message)
    } finally {
      setTimeout(() => {
        setProcessing(false)
        setProgress(0)
        setProgressMessage('')
      }, 2000)
    }
  }

  const handleDownload = async () => {
    if (!lastMergeResult?.output_file) {
      toast.warning('Nenhum arquivo consolidado disponível')
      return
    }

    try {
      const response = await axios.get(
        `${API_URL}/api/bi/download/${lastMergeResult.output_file}`,
        { responseType: 'blob' }
      )

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', lastMergeResult.output_file)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Download iniciado!')
    } catch (error) {
      toast.error('Erro ao baixar arquivo: ' + error.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FiDatabase className="mr-3 text-primary-600" size={28} />
              Base BI - Consolidação de Dados
            </h2>
            <p className="mt-2 text-gray-600">
              Mescle múltiplos relatórios CSV em uma base única consolidada por CPF ou Nome+Equipe
            </p>
          </div>
          <button
            onClick={loadFiles}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={18} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Como funciona:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Selecione os arquivos CSV que deseja consolidar</li>
          <li>• O sistema usa o <strong>CPF</strong> como chave primária para mesclar os dados</li>
          <li>• Quando o CPF não existe, usa <strong>Nome + Equipe</strong> como chave alternativa</li>
          <li>• Todos os dados são consolidados em um único arquivo CSV</li>
        </ul>
      </div>

      {/* Seleção de Arquivos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Arquivos Disponíveis ({files.length})
          </h3>
          <button
            onClick={toggleSelectAll}
            className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {selectedFiles.length === files.length ? (
              <>
                <FiCheckSquare className="mr-1" size={16} />
                Desmarcar Todos
              </>
            ) : (
              <>
                <FiSquare className="mr-1" size={16} />
                Selecionar Todos
              </>
            )}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Carregando arquivos...
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum arquivo CSV encontrado na pasta de downloads
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.relative_path}
                onClick={() => toggleFileSelection(file.relative_path)}
                className={`
                  flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedFiles.includes(file.relative_path)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <div className="flex items-center flex-1">
                  <div className="mr-3">
                    {selectedFiles.includes(file.relative_path) ? (
                      <FiCheckSquare className="text-primary-600" size={20} />
                    ) : (
                      <FiSquare className="text-gray-400" size={20} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{file.filename}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {file.folder && (
                        <span className="text-primary-600 font-medium">{file.folder}</span>
                      )}
                      <span>{file.size}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>{selectedFiles.length}</strong> de <strong>{files.length}</strong> arquivos selecionados
          </p>
        </div>
      </div>

      {/* Ações */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Processar Consolidação</h3>
            <p className="text-sm text-gray-600 mt-1">
              Clique para mesclar os arquivos selecionados
            </p>
          </div>
          <button
            onClick={handleMerge}
            disabled={processing || selectedFiles.length === 0}
            className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <FiRefreshCw className="mr-2 animate-spin" size={18} />
                Processando...
              </>
            ) : (
              <>
                <FiDatabase className="mr-2" size={18} />
                Consolidar Dados
              </>
            )}
          </button>
        </div>
        
        {/* Barra de Progresso */}
        {processing && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{progressMessage}</span>
              <span className="text-sm font-medium text-primary-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-primary-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Resultado */}
      {lastMergeResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            ✓ Consolidação Concluída
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-600">Registros Únicos</p>
              <p className="text-2xl font-bold text-green-700">{lastMergeResult.records}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-600">Total de Colunas</p>
              <p className="text-2xl font-bold text-green-700">{lastMergeResult.columns}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-600">Arquivo Gerado</p>
              <p className="text-sm font-medium text-green-700 truncate">
                {lastMergeResult.output_file}
              </p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full justify-center"
          >
            <FiDownload className="mr-2" size={18} />
            Baixar Base Consolidada
          </button>
        </div>
      )}
    </div>
  )
}

export default BaseBI
