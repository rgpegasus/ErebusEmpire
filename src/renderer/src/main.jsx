import './styles/main.css'
import './styles/menu-bar.css'
import './styles/top-bar.css'
import './styles/seasons-page.css'
import './styles/latest-episodes.css'
import './styles/loader.css'
import './styles/download-page.css'
import './styles/catalog-page.css'
import './styles/UtilityTopBar.css'
import './styles/settings-page.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const theme = localStorage.getItem('theme') || 'dark';
if (theme === 'light') {
  document.documentElement.classList.add('light-theme');
} else {
  document.documentElement.classList.remove('light-theme');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
