import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard/Dashboard'
import Login from './pages/Login/Login'
import Servicos from './pages/Servicos/Servicos'
import Clientes from './pages/Clientes/Clientes'
import Produtos from './pages/Produtos/Produtos'
import Equipe from './pages/Equipe/Equipe'
import Rotas from './pages/Rotas/Rotas'
import Financeiro from './pages/Financeiro/Financeiro'
import Relatorios from './pages/Relatorios/Relatorios'
import Settings from './pages/Settings/Settings'
import PrivateRoute from './components/PrivateRoute/PrivateRoute'

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="servicos/*" element={<Servicos />} />
              <Route path="clientes/*" element={<Clientes />} />
              <Route path="produtos/*" element={<Produtos />} />
              <Route path="equipe/*" element={<Equipe />} />
              <Route path="rotas/*" element={<Rotas />} />
              <Route path="financeiro/*" element={<Financeiro />} />
              <Route path="relatorios/*" element={<Relatorios />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
