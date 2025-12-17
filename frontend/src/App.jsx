import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import IframeGuard from './components/IframeGuard'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Queue from './pages/Queue'
import Settings from './pages/Settings'
import Rescisao from './pages/Rescisao'
import Schedules from './pages/Schedules'
import { testBackendConnection } from './utils/testConnection'

function App() {
  useEffect(() => {
    // Testa conexão com backend ao iniciar
    testBackendConnection()
  }, [])

  return (
    <IframeGuard>
      <Router>
        <div className="App">
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/queue" element={<Queue />} />
              <Route path="/schedules" element={<Schedules />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/rescisao" element={<Rescisao />} />
            </Routes>
          </Layout>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </IframeGuard>
  )
}

export default App
