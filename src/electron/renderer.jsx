import React from "react"
import ReactDOM from "react-dom/client"
import "@utils/CssImport"
import App from "@src/App"
import { HashRouter } from "react-router-dom"
import { LoaderProvider } from "@context/loader-context/LoaderContext"
import { UserProvider } from "@context/user-context/UserContext"

try {
  document.documentElement.classList.toggle("light-theme", localStorage.getItem("theme") === "light")
} catch {}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <LoaderProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </LoaderProvider>
    </HashRouter>
  </React.StrictMode>,
)
