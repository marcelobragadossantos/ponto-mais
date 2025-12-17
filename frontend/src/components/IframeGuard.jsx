import { useEffect, useState } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'

const IframeGuard = ({ children }) => {
  const [isInIframe, setIsInIframe] = useState(true)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Verifica se está dentro de um iframe
    const checkIframe = () => {
      try {
        // Se window.self !== window.top, está em um iframe
        const inIframe = window.self !== window.top
        setIsInIframe(inIframe)
        setIsChecking(false)

        if (!inIframe) {
          console.warn('Acesso direto detectado. Este sistema deve ser acessado através do iframe.')
        }
      } catch (e) {
        // Se der erro ao acessar window.top, provavelmente está em iframe com CORS
        // Neste caso, assumimos que está em iframe
        setIsInIframe(true)
        setIsChecking(false)
      }
    }

    checkIframe()
  }, [])

  // Enquanto verifica, mostra loading
  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Se não está em iframe, mostra mensagem de erro
  if (!isInIframe) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg border-2 border-red-200 p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <FiAlertTriangle className="text-red-600" size={32} />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Acesso Não Autorizado
            </h1>
            
            <p className="text-gray-600 text-center mb-6">
               
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>Atenção:</strong> Se você está tentando acessar este sistema,
                por favor, utilize o link fornecido da plataforma principal <a href="http://localhost:3000"><u>Portal Gateway</u></a> ou entre
                em contato com o administrador do sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Se está em iframe, renderiza normalmente
  return <>{children}</>
}

export default IframeGuard
