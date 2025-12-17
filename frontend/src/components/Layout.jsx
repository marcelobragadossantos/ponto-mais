import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiHelpCircle, FiFileText, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import LogsModal from './LogsModal'
import { getConfig } from '../services/api'

const Layout = ({ children }) => {
  const location = useLocation()
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    checkConfiguration()
  }, [])

  const checkConfiguration = async () => {
    try {
      const response = await getConfig()
      const config = response.data
      const configured = config?.pontomais?.destine
      setIsConfigured(configured)
    } catch (error) {
      console.error('Erro ao verificar configuração:', error)
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Relatórios', href: '/reports' },
    { name: 'Fila de Trabalho', href: '/queue' },
    { name: 'Agendamentos', href: '/schedules' },
    { name: 'Rescisão', href: '/rescisao' },
    { name: 'Configurações', href: '/settings' },
  ]

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header - Fixo */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Relatórios Ponto Eletrônico
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Extração automatizada de relatórios do PontoMais
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`flex items-center px-3 py-2 rounded-lg ${
                isConfigured 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isConfigured ? (
                  <>
                    <FiCheckCircle className="mr-2" size={16} />
                    <span className="text-sm font-medium">Configurado</span>
                  </>
                ) : (
                  <>
                    <FiAlertCircle className="mr-2" size={16} />
                    <span className="text-sm font-medium">Pendente</span>
                  </>
                )}
              </div>
              <a
                href="http://10.160.80.7/books/procedimentos-operacionais-padrao/page/pop-pontomais-report-download-bot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <FiHelpCircle className="mr-2" size={18} />
                Ajuda
              </a>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6">
          <nav className="flex space-x-1 border-b border-gray-200">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    px-6 py-3 text-sm font-medium transition-colors relative
                    ${isActive
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main Content - Com Scroll */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Footer - Fixo */}
      <footer className="bg-white border-t border-gray-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span className="font-medium">Versão 1.0.6</span>
              <span className="text-gray-400">|</span>
              <span>Web Scraping PontoMais</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowLogsModal(true)}
                className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                title="Ver logs do sistema"
              >
                <FiFileText className="mr-1.5" size={16} />
                Logs
              </button>
              <span>Desenvolvido por <span className="font-medium">Aglayrton</span></span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de Logs */}
      <LogsModal isOpen={showLogsModal} onClose={() => setShowLogsModal(false)} />
    </div>
  )
}

export default Layout
