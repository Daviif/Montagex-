import React from 'react'
import './StatCard.css'

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  iconBg, 
  change, 
  changeType,
  subtitle 
}) => {
  const getChangeColor = () => {
    if (!changeType) return ''
    return changeType === 'positive' ? 'positive' : 'negative'
  }

  return (
    <div className="stat-card fade-in">
      <div className="stat-card-header">
        <div className="stat-card-info">
          <h3 className="stat-card-title">{title}</h3>
          <div className="stat-card-value">{value}</div>
          {(change || subtitle) && (
            <div className={`stat-card-change ${getChangeColor()}`}>
              {change || subtitle}
            </div>
          )}
        </div>
        {Icon && (
          <div className="stat-card-icon" style={{ backgroundColor: iconBg }}>
            <Icon />
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard
