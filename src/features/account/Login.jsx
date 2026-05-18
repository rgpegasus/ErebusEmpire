import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons"
import { LoginPageBackground } from "@utils/dispatchers/Pictures"
import { useLoader, Loader } from "@utils/dispatchers/Page"
import { supabase } from "@services/supabase/Client" 

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { loading, setLoading } = useLoader()
  const navigate = useNavigate()
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      const result = isLogin
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

      if (result.error) {
        console.log(result.error)
        return
      }
      await window.electron.ipcRenderer.invoke("set-supabase-session", result.data.session)
      navigate("/erebus-empire/home")
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return <Loader />
  }
  return (
    <div className="login-page">
      <img src={LoginPageBackground} alt="LoginPageBackground" className="bg-image" />
      <div className="gradient-overlay"></div>

      <div className="login-form">
        <h1 className="title">EREBUS EMPIRE</h1>
        <h2>{isLogin ? "Connexion" : "Créer un compte"}</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="toggle-icon" onClick={togglePasswordVisibility}>
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </span>
          </div>

          <button type="submit" className="btn primary">
            {isLogin ? "Se connecter" : "S'inscrire"}
          </button>

          <div className="options">
            <label>
              <input type="checkbox" />
              Se souvenir de moi
            </label>
            <a href="#">Besoin d’aide ?</a>
          </div>

          <div className="actions">
            <button type="button" className="btn secondary" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Créer un compte" : "Déjà inscrit ? Se connecter"}
            </button>

            <button type="button" className="btn tertiary">
              Continuer sans se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
