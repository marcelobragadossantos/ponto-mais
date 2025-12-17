import React, { useState, useEffect } from 'react'
import { FiSave, FiEye, FiEyeOff, FiSettings, FiColumns } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { getConfig, updateLogin, updateDestination, updateRescisaoPath } from '../services/api'
import Columns from './Columns'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general') // general, columns
  const [config, setConfig] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [destinePath, setDestinePath] = useState('')
  const [rescisaoPath, setRescisaoPath] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await getConfig()
      const data = response.data
      setConfig(data)
      setDestinePath(data.pontomais?.destine || '')
      setRescisaoPath(data.rescisao_pasta || '')
    } catch (error) {
      toast.error('Erro ao carregar configurações')
    }
  }

  const handleSaveLogin = async () => {
    if (!username || !password) {
      toast.error('Preencha usuário e senha')
      return
    }

    try {
      setLoading(true)
      await updateLogin(username, password)
      toast.success('Credenciais atualizadas com sucesso!')
      setPassword('')
    } catch (error) {
      toast.error('Erro ao atualizar credenciais')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDestination = async () => {
    if (!destinePath) {
      toast.error('Preencha o caminho da pasta')
      return
    }

    try {
      setLoading(true)
      await updateDestination(destinePath)
      toast.success('Pasta de destino atualizada!')
    } catch (error) {
      toast.error('Erro ao atualizar pasta de destino')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRescisaoPath = async () => {
    if (!rescisaoPath) {
      toast.error('Preencha o caminho da pasta')
      return
    }

    try {
      setLoading(true)
      await updateRescisaoPath(rescisaoPath)
      toast.success('Pasta de rescisão atualizada!')
    } catch (error) {
      toast.error('Erro ao atualizar pasta de rescisão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Abas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center px-6 py-4 font-medium transition-colors ${
              activeTab === 'general'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiSettings className="mr-2" size={18} />
            Configurações Gerais
          </button>
          <button
            onClick={() => setActiveTab('columns')}
            className={`flex items-center px-6 py-4 font-medium transition-colors ${
              activeTab === 'columns'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiColumns className="mr-2" size={18} />
            Colunas dos Relatórios
          </button>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          
          {/* Destination Path */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pasta de Destino dos Relatórios
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caminho da Pasta
                </label>
                <input
                  type="text"
                  value={destinePath}
                  onChange={(e) => setDestinePath(e.target.value)}
                  placeholder="C:\Relatorios\PontoMais"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Os relatórios serão salvos em subpastas dentro deste diretório
                </p>
              </div>

              <button
                onClick={handleSaveDestination}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300"
              >
                <FiSave className="mr-2" />
                Salvar Pasta de Destino
              </button>
            </div>
          </div>

          {/* Rescisao Path */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pasta de Rescisão
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caminho da Pasta
                </label>
                <input
                  type="text"
                  value={rescisaoPath}
                  onChange={(e) => setRescisaoPath(e.target.value)}
                  placeholder="C:\Relatorios\Rescisao"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Pasta onde serão salvos os relatórios de rescisão
                </p>
              </div>

              <button
                onClick={handleSaveRescisaoPath}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300"
              >
                <FiSave className="mr-2" />
                Salvar Pasta de Rescisão
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              ℹ️ Informações Importantes
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• As pastas serão criadas automaticamente se não existirem</li>
              <li>• Use caminhos absolutos (ex: C:\Pasta\Subpasta)</li>
              <li>• Os arquivos baixados terão IDs removidos automaticamente</li>
            </ul>
          </div>
        </div>
      )}

      {/* Aba de Colunas */}
      {activeTab === 'columns' && (
        <div className="space-y-6">
          <Columns />
          
          {/* Info Colunas */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              ℹ️ Informações Importantes
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• As colunas devem ser atualizadas conforme as opções de colunas disponíveis no sistema PontoMais</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings