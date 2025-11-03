import React, { useState, useEffect, useRef, useContext } from "react"
import styles from "./User.module.css"
import {
  HistoryIcon,
  DiscordIcon,
  WatchlistIcon,
  DonateIcon,
  AlreadySeenIcon,
  SettingsIcon,
  OnHoldIcon,
  FavoriteIcon,
} from "@utils/dispatchers/Icons"
import OverlayPortal from "@components/overlay-portal/OverlayPortal"
import Navigation from "./components/navigation/Navigation"
import OpenUserDropdown from "./components/open-user-dropdown/OpenUserDropdown"
import ProfileEditor from "./components/profile-editor/ProfileEditor"
import { UserContext } from "@context/user-context/UserContext"

function UserDropdown() {
  const { toolBar } = useContext(UserContext)
  const [editMode, setEditMode] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const OpenUserDropdownRef = useRef(null)
  const userDropdownRef = useRef(null)
  const [isCropping, setIsCropping] = useState(false)

  const CloseMenu = () => {
    setEditMode(false)
    setMenuVisible(false)
  }
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isCropping === true) return
      if (
        OpenUserDropdownRef.current &&
        !OpenUserDropdownRef.current.contains(event.target) &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        CloseMenu()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isCropping])
  return (
    <div className={styles.Global}>
      <div ref={OpenUserDropdownRef}>
        <OpenUserDropdown onClick={() => setMenuVisible((prev) => !prev)} />
      </div>
      <div>
        {menuVisible && (
          <OverlayPortal>
            <div
              className={`${styles.Overlay} ${menuVisible && styles.MenuVisible}`}
              onClick={() => setMenuVisible(false)}
            ></div>
            <div
              className={`${styles.Container} ${menuVisible && styles.MenuVisible} ${toolBar && styles.PinToolBar}`}
              ref={userDropdownRef}
            >
              <ProfileEditor
                editMode={editMode}
                setEditMode={setEditMode}
                setIsCropping={setIsCropping}
              />
              <div className={styles.Separation}></div>
              <Navigation
                to="/erebus-empire/settings"
                icon={<SettingsIcon />}
                label="Paramètres"
                onNavigate={() => setMenuVisible(false)}
              />
              {/* <Navigation to="/erebus-empire/switchAccount" icon={SwitchAccountIcon} label="Changer de profil" onNavigate={() => setMenuVisible(false)}/> */}
              <div className={styles.Separation}></div>
              <Navigation
                to="/erebus-empire/favorites"
                icon={<FavoriteIcon />}
                label="Favoris"
                onNavigate={() => setMenuVisible(false)}
              />
              <Navigation
                to="/erebus-empire/watchlist"
                icon={<WatchlistIcon />}
                label="Watchlist"
                onNavigate={() => setMenuVisible(false)}
              />
              <Navigation
                to="/erebus-empire/history"
                icon={<HistoryIcon />}
                label="En cours"
                onNavigate={() => setMenuVisible(false)}
              />
              <Navigation
                to="/erebus-empire/onHold"
                icon={<OnHoldIcon />}
                label="En attente"
                onNavigate={() => setMenuVisible(false)}
              />
              <Navigation
                to="/erebus-empire/alreadySeen"
                icon={<AlreadySeenIcon />}
                label="Déjà Vu"
                onNavigate={() => setMenuVisible(false)}
              />
              <div className={styles.Separation}></div>
              <Navigation
                to="https://discord.gg/Mj9cYRQTcU"
                icon={<DiscordIcon />}
                label="Discord"
                onNavigate={() => setMenuVisible(false)}
              />
              <Navigation
                to="https://paypal.me/rgpegasuspro"
                icon={<DonateIcon />}
                label="Soutenir"
                onNavigate={() => setMenuVisible(false)}
              />
              {/* <Navigation icon={LogOutIcon} label="Se déconnecter" onClick={() => {console.log('Déconnexion activée'); }} onNavigate={() => setMenuVisible(false)}/> */}
            </div>
          </OverlayPortal>
        )}
      </div>
    </div>
  )
}

export default UserDropdown
