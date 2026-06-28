import React, { useState, useEffect, useContext, useRef, useCallback } from "react"
import { useLocation } from "react-router-dom"
import {
  LightThemeIcon,
  DarkThemeIcon,
  ColorPickerIcon,
  ColorPaletteIcon,
  CloseIcon,
} from "@utils/dispatchers/Icons"
import ReactDOM from "react-dom"
import { HexColorPicker } from "react-colorful"
import chroma from "chroma-js"
import styles from "./Theme.module.css"
import { UserContext } from "@context/user-context/UserContext"

export default function Theme({ visible = false, onClose }) {
  const [menuVisible, setMenuVisible] = useState(false)
  const { theme, colorTheme, updateTheme, updateColorTheme } = useContext(UserContext)
  const location = useLocation()
  const [themeColor, setThemeColor] = useState(colorTheme || "#0B0C10")
  const [inputValue, setInputValue] = useState(themeColor)
  const [intensity, setIntensity] = useState(1) // 0 à 1, 1 = comportement actuel (100%)

  // --- Drag state ---
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 })

  const handleDragStart = (e) => {
    if (e.target.closest(`.${styles.BackButton}`)) return

    dragRef.current.dragging = true
    dragRef.current.startX = e.clientX
    dragRef.current.startY = e.clientY
    dragRef.current.originX = position.x
    dragRef.current.originY = position.y
  }

  const handleDragMove = useCallback((e) => {
    if (!dragRef.current.dragging) return
    const deltaX = e.clientX - dragRef.current.startX
    const deltaY = e.clientY - dragRef.current.startY
    setPosition({
      x: dragRef.current.originX + deltaX,
      y: dragRef.current.originY + deltaY,
    })
  }, [])

  const handleDragEnd = useCallback(() => {
    dragRef.current.dragging = false
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", handleDragMove)
    window.addEventListener("mouseup", handleDragEnd)
    return () => {
      window.removeEventListener("mousemove", handleDragMove)
      window.removeEventListener("mouseup", handleDragEnd)
    }
  }, [handleDragMove, handleDragEnd])

  useEffect(() => {
    setMenuVisible(visible)
  }, [visible])

  // Reset la position chaque fois que le panneau se réaffiche (optionnel, à retirer si tu veux garder la position)
  useEffect(() => {
    if (visible) setPosition({ x: 0, y: 0 })
  }, [visible])

  const SaveColor = () => {
    updateColorTheme(themeColor)
    onClose()
  }
  useEffect(() => {
    const episodeRoute = /^\/erebus-empire\/[^/]+\/[^/]+\/[^/]+$/
    if (episodeRoute.test(location.pathname)) {
      onClose()
    }
  }, [location.pathname])
  const handleHexInput = (val) => {
    if (val.trim() === "") {
      setInputValue("")
      setThemeColor("#0B0C10")
      return
    }
    if (!val.startsWith("#")) {
      val = "#" + val
    }
    setInputValue(val)
    if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(val)) {
      setThemeColor(val)
      updateColorTheme(val)
    }
  }

  const pickColor = async () => {
    if (!window.EyeDropper) {
      alert("EyeDropper API non supportée sur ce navigateur.")
      return
    }

    try {
      const eyeDropper = new window.EyeDropper()
      const result = await eyeDropper.open()
      setThemeColor(result.sRGBHex)
      setInputValue(result.sRGBHex)
      updateColorTheme(result.sRGBHex)
    } catch (e) {
      console.error("Sélection annulée ou erreur", e)
    }
  }

  const discordify = (hex, factor = 1) => {
    const [h, s, l] = chroma(hex).hsl()
    const newHue = (h + 320 * factor) % 360
    const newSat = Math.min(1, s * (1 + 0.8 * factor))
    const newLight = l * (1 - 0.6 * factor)
    return chroma.hsl(newHue, newSat, newLight).hex()
  }

  const lightify = (hex, factor = 1) => {
    const [h, s, l] = chroma(hex).hsl()
    const newSat = s * (1 - 0.7 * factor) + 0.3 * factor
    const newLight = l * (1 - 0.5 * factor) + 0.5 * factor
    return chroma.hsl(h, newSat, newLight).hex()
  }

  const applyThemeColors = (baseHex) => {
    let base

    if (theme === "dark") {
      base = colorTheme ? discordify(baseHex, intensity) : discordify("#0B0C10", intensity)
      const variants = {
        "--color-background": chroma(base).darken(0.1).hex(),
        "--color-background-rgb": chroma(base).darken(0.1).rgb().join(","),
        "--color-secondary": chroma(base).brighten(0.05).hex(),
        "--color-secondary-rgb": chroma(base).brighten(0.05).rgb().join(","),
        "--color-primary": chroma(base).darken(0.6).rgb().join(","),
        "--color-primary-rgb": chroma(base).darken(0.6).rgb().join(","),
        "--color-separation": chroma(base).brighten(0.5).hex(),
        "--color-separation-rgb": chroma(base).brighten(0.5).rgb().join(","),
        "--color-text-primary": chroma(base).brighten(4.4).hex(),
        "--color-text-primary-rgb": chroma(base).brighten(4.4).rgb().join(","),
        "--color-text-secondary": "#FFF",
        "--color-text-secondary-rgb": "255, 255, 255",
        "--color-shadow": chroma(base).darken(0.6).hex(),
        "--color-shadow-rgb": chroma(base).darken(0.6).rgb().join(","),
      }
      Object.entries(variants).forEach(([key, val]) =>
        document.documentElement.style.setProperty(key, val),
      )
    } else {
      base = colorTheme ? lightify(baseHex, intensity) : lightify("#bababaff", intensity)
      const lightTheme = {
        "--color-background": chroma(base).darken(0.05).hex(),
        "--color-background-rgb": chroma(base).darken(0.05).rgb().join(","),
        "--color-secondary": chroma(base).brighten(0.3).hex(),
        "--color-secondary-rgb": chroma(base).brighten(0.3).rgb().join(","),
        "--color-primary": chroma(base).brighten(0.5).hex(),
        "--color-primary-rgb": chroma(base).brighten(0.5).rgb().join(","),
        "--color-separation": chroma(base).darken(0.3).hex(),
        "--color-separation-rgb": chroma(base).darken(0.3).rgb().join(","),
        "--color-text-primary": chroma(base).darken(4.4).hex(),
        "--color-text-primary-rgb": chroma(base).darken(4.4).rgb().join(","),
        "--color-text-secondary": "#000",
        "--color-text-secondary-rgb": "1, 1, 1",
        "--color-shadow": chroma(base).darken(0.3).hex(),
        "--color-shadow-rgb": chroma(base).darken(0.3).rgb().join(","),
      }
      Object.entries(lightTheme).forEach(([key, val]) =>
        document.documentElement.style.setProperty(key, val),
      )
    }
  }

  useEffect(() => {
    const baseColor = colorTheme || "#0B0C10"
    applyThemeColors(baseColor)
  }, [themeColor, theme, colorTheme, intensity])

  if (!menuVisible) return null

  return ReactDOM.createPortal(
    <div>
      {menuVisible && (
        <div
          className={styles.ThemeContainer}
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        >
          <div>
            <div
              className={styles.TopContainer}
              onMouseDown={handleDragStart}
              style={{ cursor: "grab" }}
            >
              <div className={styles.Title}>Personnaliser le thème</div>
              <div onClick={onClose}>
                <CloseIcon className={styles.BackButton} />
              </div>
            </div>

            {/* Apparence */}
            <div className={styles.ItemContainer}>
              <div className={styles.TitleItem}>Apparence</div>
              <div className={styles.AspectContainer}>
                <div
                  onClick={() => updateTheme("dark")}
                  className={`${styles.AspectItem} ${theme === "dark" ? styles.Selected : ""}`}
                >
                  <div className={styles.NameAspectContainer}>Mode sombre</div>
                  <DarkThemeIcon className={styles.AspectIcon} />
                </div>
                <div
                  onClick={() => updateTheme("light")}
                  className={`${styles.AspectItem} ${theme === "light" ? styles.Selected : ""}`}
                >
                  <div className={styles.NameAspectContainer}>Mode clair</div>
                  <LightThemeIcon className={styles.AspectIcon} />
                </div>
              </div>
            </div>

            {/* Couleurs */}
            <div className={styles.ItemContainer}>
              <div className={styles.ItemTitleContainer}>
                <div className={styles.TitleItem}>Couleurs</div>
                <label className={styles.Switch}>
                  <input
                    type="checkbox"
                    checked={!!colorTheme}
                    onChange={() => updateColorTheme(colorTheme ? "" : themeColor)}
                  />
                  <span className={styles.Slider}>
                    <span className={styles.Icon}>
                      {colorTheme ? <ColorPaletteIcon /> : <ColorPickerIcon />}
                    </span>
                  </span>
                </label>
              </div>
              <div className={styles.ColorPicker}>
                <HexColorPicker
                  color={themeColor}
                  onChange={(color) => {
                    setThemeColor(color)
                    setInputValue(color)
                    updateColorTheme(color)
                  }}
                />
              </div>
              <div className={styles.ColorToolsContainer}>
                <div className={styles.ActiveColor} style={{ backgroundColor: inputValue }}></div>
                <input
                  type="text"
                  value={inputValue}
                  maxLength={7}
                  onChange={(e) => handleHexInput(e.target.value)}
                  className={styles.HexInput}
                  placeholder="#0B0C10"
                />
                <ColorPickerIcon className={styles.PipetteButton} onClick={pickColor} />
              </div>
            </div>

            {/* Intensité */}
            <div className={styles.ItemContainer}>
              <div className={styles.ItemTitleContainer}>
                <div className={styles.TitleItem}>Intensité</div>
                <div className={styles.IntensityValue}>{Math.round(intensity * 100)}%</div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={intensity * 100}
                onChange={(e) => setIntensity(Number(e.target.value) / 100)}
                className={styles.IntensitySlider}
              />
            </div>
          </div>
          {/* <div onClick={()=> SaveColor()} className={styles.SaveButton}>
            Sauvegarde
          </div> */}
        </div>
      )}
    </div>,
    document.body,
  )
}
