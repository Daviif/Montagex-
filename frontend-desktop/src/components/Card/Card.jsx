import React from 'react'
import './Card.css'

const Card = ({ title, subtitle, children, extra, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {(title || extra) && (
        <div className="card-header">
          <div className="card-header-text">
            {title && <h2 className="card-title">{title}</h2>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {extra && <div className="card-extra">{extra}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  )
}

export default Card
