import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import background from "../../../../../resources/pictures/login_page.png";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="login-page">
      <img src={background} alt="background" className="bg-image" />
      <div class="gradient-overlay"></div>
      <div className="login-form">
        
        <h1 className="title">EREBUS EMPIRE</h1>
        <h2>{isLogin ? "Connexion" : "Créer un compte"}</h2>

        <form>
          <input type="email" placeholder="Adresse e-mail" required />

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              required
            />
            <span className="toggle-icon" onClick={togglePasswordVisibility}>
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </span>
          </div>

          <button className="btn primary">{isLogin ? "Se connecter" : "S'inscrire"}</button>

          <div className="options">
            <label>
              <input type="checkbox" />
              Se souvenir de moi
            </label>
            <a href="#">Besoin d’aide ?</a>
          </div>

          <div className="actions">
            <button
              type="button"
              className="btn secondary"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Créer un compte" : "Déjà inscrit ? Se connecter"}
            </button>

            <button type="button" className="btn tertiary">
              Continuer sans se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
