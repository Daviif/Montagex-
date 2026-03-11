import React from 'react'
import { MdSearch, MdNotifications, MdDarkMode, MdLightMode, MdMenu } from 'react-icons/md'
import { useTheme } from '../../contexts/ThemeContext'
import './Header.css'

const Header = ({ onMenuToggle, isSidebarOpen = false }) => {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="header">
      <button
        type="button"
        className="mobile-menu-btn"
        onClick={onMenuToggle}
        aria-label={isSidebarOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
      >
        <MdMenu className="menu-icon" />
      </button>

      <div className="header-search">
        <MdSearch className="search-icon" />
        <input
          type="text"
          placeholder="Buscar..."
          className="search-input"
        />
      </div>

      <div className="header-actions">
        <button className="theme-btn" onClick={toggleTheme} title="Alternar tema">
          {theme === 'light' ? (
            <MdDarkMode className="theme-icon" />
          ) : (
            <MdLightMode className="theme-icon" />
          )}
        </button>

        <button className="notification-btn">
          <MdNotifications className="notification-icon" />
          <span className="notification-badge">3</span>
        </button>
      </div>
    </header>
  )
}

export default Header
