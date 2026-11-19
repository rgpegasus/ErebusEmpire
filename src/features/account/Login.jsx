import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons"
import { LoginPageBackground } from "@utils/dispatchers/Pictures"
import { supabase } from "@services/supabase/Client"

const translate = (error) => {
  const m = error?.message ?? ""
  if (/invalid login credentials/i.test(m)) return "E-mail ou mot de passe incorrect."
  if (/already registered/i.test(m)) return "Un compte existe déjà avec cet e-mail."
  if (/password should be at least/i.test(m)) return "Le mot de passe doit contenir au moins 6 caractères."
  if (/email not confirmed/i.test(m)) return "Confirme ton e-mail avant de te connecter."
  if (/rate limit/i.test(m)) return "Trop de tentatives, réessaie dans quelques minutes."
  return m || "Une erreur est survenue."
}

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage(null)
    try {
      const { data, error } = isLogin
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password })
      if (error) return setMessage({ type: "error", text: translate(error) })
      if (!data.session) return setMessage({ type: "info", text: "Compte créé : vérifie ta boîte mail pour confirmer l'adresse." })
      navigate("/erebus-empire/home") 
    } catch (err) {
      setMessage({ type: "error", text: translate(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <img src={LoginPageBackground} alt="" className="bg-image" />
      <div className="gradient-overlay" />
      <div className="login-form">
        <h1 className="title">EREBUS EMPIRE</h1>
        <h2>{isLogin ? "Connexion" : "Créer un compte"}</h2>

        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Adresse e-mail" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} required />

          <div className="password-wrapper">
            <input type={showPassword ? "text" : "password"} placeholder="Mot de passe" minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="toggle-icon" aria-label="Afficher le mot de passe"
              onClick={() => setShowPassword((v) => !v)}>
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>

          {message && (
            <p role="alert" className={`login-message ${message.type}`}>{message.text}</p>
          )}

          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "…" : isLogin ? "Se connecter" : "S'inscrire"}
          </button>

          <div className="actions">
            <button type="button" className="btn secondary" onClick={() => { setIsLogin(!isLogin); setMessage(null) }}>
              {isLogin ? "Créer un compte" : "Déjà inscrit ? Se connecter"}
            </button>
            <button type="button" className="btn tertiary" onClick={() => navigate("/erebus-empire/home")}>
              Continuer sans se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
