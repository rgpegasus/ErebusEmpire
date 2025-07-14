import React from 'react'
import ReactDOM from 'react-dom/client'
import '@utils/CssImport'
import App from '@src/App'

function applyTheme() {
  const theme = localStorage.getItem('theme') || 'dark'
  document.documentElement.classList.toggle('light-theme', theme === 'light')
}

applyTheme()

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode> 
)