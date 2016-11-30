import React from 'react'
import './loading-dots.component.css'

class LoadingDots extends React.Component {
  render() {
    return (
      <div className="loading">
        <div className="loading-dot loading-dot_1"></div>
        <div className="loading-dot loading-dot_2"></div>
        <div className="loading-dot loading-dot_3"></div>
      </div>
    );
  }
}

export default LoadingDots
