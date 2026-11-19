import React, { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useLoader } from "@context/loader-context/LoaderContext"
import styles from "./Catalog.module.css"
import { LoginPageBackground } from "@utils/dispatchers/Pictures"
import BackgroundCover from "@components/background-cover/BackgroundCover"
import ContentsCarousel from "@components/contents-carousel/ContentsCarousel"
export const Catalog = () => {
  const [animeList, setAnimeList] = useState([])
  const [hasNext, setHasNext] = useState(true)

  const { setLoading } = useLoader()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get("page") || "1", 10)
  const [inputValue, setInputValue] = useState("")

  const fetchData = async (startPage, searchQuery = "") => {
    setLoading(true)

    try {
      const isSearching = searchQuery.trim() !== ""
      const functionName = isSearching ? "search-anime" : "get-all-anime"
      const functionArgs = isSearching ? [searchQuery, 50] : []

      const results = await window.api.invoke(functionName, ...functionArgs, startPage)
      document.querySelector(".MainPage")?.scrollTo({ top: 0, behavior: "auto" })
      setAnimeList(results ?? [])
      setHasNext((results ?? []).length > 0)
    } catch (error) {
      console.error("Erreur lors du chargement des données :", error)
    } finally {
      setLoading(false)
    }
  }
  const query = searchParams.get("q") ?? ""
  useEffect(() => {
    setInputValue(query)
    fetchData(page, query)
  }, [page, query])

  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") {
      return
    }

    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      params.set("page", 1)

      if (inputValue.trim()) {
        params.set("q", inputValue.trim())
      } else {
        params.delete("q")
      }

      return params
    })
    setInputValue(inputValue.trim())
  }

  const handlePageChange = (delta) => {
    const newPage = page + delta
    if (newPage < 1) return

    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      params.set("page", newPage)
      if (inputValue.trim()) {
        params.set("q", inputValue)
      } else {
        params.delete("q")
      }
      return params
    })
  }

  return (
    <div className="MainPage">
      {/* <BackgroundCover coverInfo={LoginPageBackground} whileWatching={false} isAnime={false} /> */}
      <div className={styles.Container}>
        <ContentsCarousel
          data={animeList}
          title="Catalogue"
          onClickEpisode={(anime) => navigate(`/erebus-empire/${anime.url.split("/")[4]}/`)}
          getEpisodeCover={(anime) => anime.cover}
          getEpisodeTitle={(anime) => anime.title}
          isSeason={true}
          customType={`~~Page ${page}`}
          searchValue={inputValue}
          setSearchValue={setInputValue}
          onSearchKeyDown={handleSearchKeyDown}
        />
        <div className={styles.NavigationContainer}>
          <button
            className={styles.NavigationButton}
            onClick={() => handlePageChange(-1)}
            disabled={page <= 1}
          >
            Précédent
          </button>
          <button
            className={styles.NavigationButton}
            onClick={() => handlePageChange(1)}
            disabled={!hasNext}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  )
}
