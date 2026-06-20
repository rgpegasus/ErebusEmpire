import React from 'react'
import ReactDOM from 'react-dom/client'
import '@utils/CssImport'
import App from '@src/App'
import { HashRouter as Router } from 'react-router-dom';
import { LoaderProvider } from "@utils/dispatchers/Page"
import { UserProvider } from "@context/user-context/UserContext"

function applyTheme() {
  const theme = localStorage.getItem('theme') || 'dark'
  document.documentElement.classList.toggle('light-theme', theme === 'light')
}

applyTheme()

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <LoaderProvider>
      <UserProvider>
        <Router>
          <App />
        </Router>
      </UserProvider>
    </LoaderProvider>
  </React.StrictMode>,
)