import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import Header from '../Header/Header'
import { getOfflineQueueStatus, OFFLINE_QUEUE_EVENT } from '../../services/api'
import './Layout.css'

const Layout = () => {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  )
  const [queueStatus, setQueueStatus] = useState(getOfflineQueueStatus())

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

  return (
    <div className="layout">
      <Sidebar isOffline={isOffline} queueStatus={queueStatus} />
      <div className="layout-content">
        <Header />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
