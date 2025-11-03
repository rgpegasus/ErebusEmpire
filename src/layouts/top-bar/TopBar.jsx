import React, { useContext, useState, useEffect } from "react"
import styles from "./TopBar.module.css"
import LogoErebus from "./components/logo-erebus/LogoErebus"
import SearchAnime from "@layouts/dropdown/search-anime/SearchAnime"
import UserDropdown from "@layouts/dropdown/user/User"
import { UserContext } from "@context/user-context/UserContext"
function TopBar() {
  const { toolBar } = useContext(UserContext)
  const [show, setShow] = useState(false);
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (e.clientY <= 5) setShow(true)
      if (e.clientY > 60) setShow(false)
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])
  return (
    <div className={`${styles.Container} ${toolBar || show ? styles.PinToolBar : ""}`}>
      <LogoErebus />
      <div className={styles.Categories}>
        <SearchAnime />
        <UserDropdown />
      </div>
    </div>
  )
}

export default TopBar
