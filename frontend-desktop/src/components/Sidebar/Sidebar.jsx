import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  MdDashboard, 
  MdConstruction, 
  MdPeople, 
  MdInventory,
  MdGroups,
  MdRoute,
  MdAttachMoney,
  MdBarChart
} from 'react-icons/md'
import { FaBox } from 'react-icons/fa'
import { useAuth } from '../../contexts/AuthContext'
import './Sidebar.css'

const menuItems = [
  {
    path: '/dashboard',
    icon: MdDashboard,
    label: 'Dashboard'
  },
  {
    path: '/servicos',
    icon: MdConstruction,
    label: 'Serviços'
  },
  {
    path: '/clientes',
    icon: MdPeople,
    label: 'Clientes'
  },
  {
    path: '/produtos',
    icon: MdInventory,
    label: 'Produtos'
  },
  {
    path: '/equipe',
    icon: MdGroups,
    label: 'Equipe'
  },
  {
    path: '/rotas',
    icon: MdRoute,
    label: 'Rotas'
  },
  {
    path: '/financeiro',
    icon: MdAttachMoney,
    label: 'Financeiro'
  },
  {
    path: '/relatorios',
    icon: MdBarChart,
    label: 'Relatórios'
  }
]

const Sidebar = ({ isOffline = false, queueStatus = { pending: 0, isSyncing: false } }) => {
  const { user, signOut } = useAuth()

  const getConnectionStatus = () => {
    if (isOffline) {
      return {
        text: 'Offline',
        dotClass: 'status-dot status-dot--offline'
      }
    }

    if (queueStatus?.isSyncing) {
      return {
        text: `Sincronizando (${queueStatus.pending})`,
        dotClass: 'status-dot status-dot--syncing'
      }
    }

    if ((queueStatus?.pending || 0) > 0) {
      return {
        text: `Online • ${queueStatus.pending} pendente(s)`,
        dotClass: 'status-dot status-dot--pending'
      }
    }

    return {
      text: 'Online',
      dotClass: 'status-dot status-dot--online'
    }
  }

  const connectionStatus = getConnectionStatus()

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <FaBox className="logo-icon" />
          <span className="logo-text">Montagex</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="nav-icon" />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.nome?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.nome || 'Usuário'}</div>
            <div className="user-role">
              {user?.tipo_usuario === 'admin' ? 'Administrador' : 'Montador'}
            </div>
            <div className="user-status">
              <span className={connectionStatus.dotClass}></span>
              <span className="status-text">{connectionStatus.text}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
