import React from 'react'
import { MdSearch, MdNotifications, MdDarkMode, MdLightMode } from 'react-icons/md'
import { useTheme } from '../../contexts/ThemeContext'
import './Header.css'

const Header = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="header">
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
