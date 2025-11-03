import { useNavigate } from "react-router-dom";
import styles from "./NotFound.module.css"
export const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.Container}>
    <h1>404 - Page introuvable</h1>
    <p onClick={()=>navigate("/")}>Oups, ce chemin n'existe pas, retour à la maison ?</p>
  </div>
  );
};
