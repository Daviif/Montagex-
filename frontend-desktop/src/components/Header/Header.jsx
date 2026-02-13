import React from 'react'
import { MdSearch, MdNotifications } from 'react-icons/md'
import './Header.css'

const Header = () => {
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
        <button className="notification-btn">
          <MdNotifications className="notification-icon" />
          <span className="notification-badge">3</span>
        </button>
      </div>
    </header>
  )
}

export default Header
