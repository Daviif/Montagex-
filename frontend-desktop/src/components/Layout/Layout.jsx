import React, { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import Header from '../Header/Header'
import { getOfflineQueueStatus, OFFLINE_QUEUE_EVENT } from '../../services/api'
import './Layout.css'

const Layout = () => {
  const location = useLocation()
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  )
  const [queueStatus, setQueueStatus] = useState(getOfflineQueueStatus())
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const closeSidebar = () => setIsSidebarOpen(false)
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    const handleQueueUpdate = (event) => {
      if (event?.detail) {
        setQueueStatus(event.detail)
      } else {
        setQueueStatus(getOfflineQueueStatus())
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener(OFFLINE_QUEUE_EVENT, handleQueueUpdate)

    setQueueStatus(getOfflineQueueStatus())

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener(OFFLINE_QUEUE_EVENT, handleQueueUpdate)
    }
  }, [])

  useEffect(() => {
    closeSidebar()
  }, [location.pathname])

  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    if (isSidebarOpen) {
      document.body.classList.add('mobile-nav-open')
    } else {
      document.body.classList.remove('mobile-nav-open')
    }

    return () => {
      document.body.classList.remove('mobile-nav-open')
    }
  }, [isSidebarOpen])

  return (
    <div className="layout">
      <Sidebar
        isOffline={isOffline}
        queueStatus={queueStatus}
        isOpen={isSidebarOpen}
        onNavigate={closeSidebar}
        onClose={closeSidebar}
      />
      <button
        type="button"
        className={`layout-backdrop ${isSidebarOpen ? 'layout-backdrop--visible' : ''}`}
        onClick={closeSidebar}
        aria-label="Fechar menu lateral"
      />
      <div className="layout-content">
        <Header onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
