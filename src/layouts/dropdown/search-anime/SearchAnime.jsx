import React, { useEffect, useState, useRef } from "react"
import { SearchIcon } from "@utils/dispatchers/Icons"
import { useNavigate } from "react-router-dom"
import ImgLoader from "@components/img-loader/ImgLoader"
import styles from "./SearchAnime.module.css"

const SearchAnime = () => {
  const logoRef = useRef(null)
  const [inputValue, setInputValue] = useState("")
  const [results, setResults] = useState([])
  const enterCooldown = useRef(false)
  const inputRef = useRef(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  useEffect(() => {
    const handleClickOutside = (event) => {
      setTimeout(() => {
        const target = event.target
        if (
          inputRef.current &&
          !inputRef.current.contains(target) &&
          logoRef.current &&
          !logoRef.current.contains(target)
        ) {
          logoRef.current.classList.remove("hide")
          setInputValue("")
          setResults([])
          setSearchOpen(false)
        }
      }, 0)
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [searchOpen])

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && results.length > 0 && !enterCooldown.current) {
      handleCardClick(results[0])
    }
  }
  const handleInputChange = async (event) => {
    const newValue = event.target.value
    setInputValue(newValue)

    const data = await window.electron.ipcRenderer.invoke("search-anime", newValue, 5, null)
    setResults(data)
  }
  const getAnimeId = (url) => {
    try {
      const cleanUrl = new URL(url)
      const pathname = cleanUrl.pathname.replace(/\/$/, "")
      const parts = pathname.split("/").filter(Boolean)
      return parts[parts.length - 1]
    } catch (e) {
      console.error("URL invalide :", url)
      return ""
    }
  }
  const handleCardClick = (anime) => {
    enterCooldown.current = true
    setTimeout(() => {
      enterCooldown.current = false
    }, 300)

    setSearchOpen(false)
    setInputValue("")
    setResults([])
    navigate(`/erebus-empire/${getAnimeId(anime.url)}/`)
  }
  const toggleSearch = () => {
    setSearchOpen((prev) => {
      const newVisible = !prev
      return newVisible
    })
    setInputValue("")
    setResults([])
  }
  return (
    <>
      <div className={styles.SearchContainer}>
        <div
          ref={logoRef}
          onClick={() => {
            if (!searchOpen) {
              toggleSearch()
            }
          }}
          className={`${styles.LogoContainer} ${searchOpen ? styles.Open : ""}`}
        >
          <SearchIcon
            className={styles.Logo}
            onClick={() => {
              if (searchOpen) {
                toggleSearch()
              }
            }}
          />
          <div>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher..."
              className={`${styles.SearchBar} ${searchOpen ? styles.Open : ""}`}
            />
          </div>
        </div>
        {inputValue && results.length > 0 && (
          <div className={styles.ResultContainer}>
            {results?.map((anime) => (
              <div className={styles.Item} onClick={() => handleCardClick(anime)}>
                <div className={styles.Cover}>
                  <ImgLoader key={anime.title + anime.cover} anime={anime} />
                </div>
                <div>
                  <h3 className={styles.AnimeTitle}>{anime.title}</h3>
                  <h4 className={styles.EpisodeTitle}>{anime.altTitles?.[0] || ""}</h4>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default SearchAnime
