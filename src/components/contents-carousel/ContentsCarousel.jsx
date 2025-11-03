import React, { useState, useEffect, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { toSlug } from "@utils/functions/toSlug"
import styles from "./ContentsCarousel.module.css"
import CarouselHeader from "./components/carousel-header/CarouselHeader"
import CarouselItem from "./components/episode-item/EpisodeItem"
import CarouselNavigation from "./components/navigation/Navigation"

const ContentsCarousel = ({
  data = [],
  onClickEpisode,
  onDeleteEpisode = () => {},
  getEpisodeCover = () => "",
  getAnimeTitle = () => "",
  getEpisodeSubTitle = () => "",
  getEpisodeTitle = () => "",
  getUrlErebus = () => "",
  getAnimeUrl = "",
  currentLanguage = "language",
  title = "",
  enableShiftDelete = false,
  display = true,
  isSeason = false,
  availableLanguages = [],
  onLanguageChange,
  searchBy = "title",
  onContentTypeChange,
  availableContentTypes = { hasAnime: false, hasManga: false },
  contentType = "anime",
  isGridMode = true,
}) => {
  const [watchedEpisodes, setWatchedEpisodes] = useState([])
  const [isInside, setIsInside] = useState(false)
  const [isGrabing, setIsGrabing] = useState(false)
  const [shiftPressed, setShiftPressed] = useState(false)
  const [activeIndex, setActiveIndex] = useState(null)
  const [isAscending, setIsAscending] = useState(true)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [gridMode, setGridMode] = useState(isGridMode)
  const [searchValue, setSearchValue] = useState("")
  const [filteredData, setFilteredData] = useState(data)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "center",
    skipSnaps: false,
    containScroll: "trimSnaps",
    dragFree: true,
  })

  const handleSearch = () => {
    if (!searchValue) {
      setFilteredData(data)
      return
    }

    if (searchBy === "title") {
      setFilteredData(
        data.filter((ep) => getAnimeTitle(ep).toLowerCase().includes(searchValue.toLowerCase())),
      )
    } else if (searchBy === "episode") {
      setFilteredData(
        data.filter((ep) => {
          const val = searchValue.toLowerCase()
          const textMatch = getEpisodeSubTitle(ep)?.toLowerCase().includes(val)
          const numbersInTitle = getEpisodeSubTitle(ep)?.match(/\d+/g) || []
          const numberMatch = numbersInTitle.some((num) => num.includes(val))
          return textMatch || numberMatch
        }),
      )
    }
  }

  useEffect(() => {
    handleSearch()
  }, [searchValue])

  useEffect(() => {
    setFilteredData(data)
  }, [data])

  useEffect(() => {
    const loadWatchedEpisodes = async () => {
      const all = await animeData.loadAll("animeWatchHistory")
      if (!all) return

      const episodes = Object.entries(all).map(([key, data]) => ({ key, ...data }))
      episodes.sort((a, b) => b.timestamp - a.timestamp)
      setWatchedEpisodes(episodes)
    }

    loadWatchedEpisodes()
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap()
      setActiveIndex(index)
    }

    emblaApi.on("select", onSelect)

    return () => emblaApi.off("select", onSelect)
  }, [emblaApi])

  useEffect(() => {
    if (!enableShiftDelete) return

    const handleDown = (e) => {
      if (e.key === "Shift" && isInside) setShiftPressed(true)
    }

    const handleUp = (e) => {
      if (e.key === "Shift") setShiftPressed(false)
    }

    window.addEventListener("keydown", handleDown)
    window.addEventListener("keyup", handleUp)

    return () => {
      window.removeEventListener("keydown", handleDown)
      window.removeEventListener("keyup", handleUp)
    }
  }, [enableShiftDelete, isInside])

  const getProgressForEpisode = (episode) => {
    const match = watchedEpisodes.find((ep) => ep.key === getUrlErebus(episode))
    if (!match || !match.videoDuration) return []

    const minutes = (match.videoDuration - match.videoTime) / 60
    const duration = Math.min(100, (match.videoTime / match.videoDuration) * 100)
    if (minutes < 1) {
      return [minutes, duration]
    } else {
      return [Math.round(minutes), duration]
    }
  }

  const handleClick = (episode, e) => {
    if (enableShiftDelete && e.shiftKey) {
      onDeleteEpisode(episode)
      return
    }
    onClickEpisode(episode, e)
  }

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  if (data.length === 0 && !display) {
    return null
  }

  const sortedData = isAscending ? filteredData : [...filteredData].reverse()

  return (
    <div className={styles.Container}>
      {title && <div className={styles.CarouselTitle}>{title}</div>}
      <CarouselHeader
        data={sortedData}
        isAscending={isAscending}
        setIsAscending={setIsAscending}
        isSeason={isSeason}
        currentLanguage={currentLanguage}
        availableLanguages={availableLanguages}
        onLanguageChange={onLanguageChange}
        gridMode={gridMode}
        setGridMode={setGridMode}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        onContentTypeChange={onContentTypeChange}
        availableContentTypes={availableContentTypes}
        contentType={contentType}
      />

      {sortedData.length > 0 ? (
        gridMode ? (
          <div
            className={styles.GridWrapper}
            onMouseEnter={() => setIsInside(true)}
            onMouseLeave={() => setIsInside(false)}
          >
            {sortedData.map((episode, index) => (
              <CarouselItem
                key={index}
                episode={episode}
                index={index}
                activeIndex={activeIndex}
                shiftPressed={shiftPressed}
                enableShiftDelete={enableShiftDelete}
                getProgressForEpisode={getProgressForEpisode}
                getEpisodeCover={getEpisodeCover}
                getAnimeTitle={getAnimeTitle}
                getEpisodeSubTitle={getEpisodeSubTitle}
                getEpisodeTitle={getEpisodeTitle}
                currentLanguage={currentLanguage}
                isSeason={isSeason}
                onClick={handleClick}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                contentType={contentType}
              />
            ))}
          </div>
        ) : (
          <div
            className={styles.CarouselContainer}
            onMouseEnter={() => setIsInside(true)}
            onMouseLeave={() => setIsInside(false)}
            onMouseDown={() => setIsGrabing(true)}
            onMouseUp={() => setIsGrabing(false)}
          >
            <CarouselNavigation
              direction="prev"
              onClick={scrollPrev}
              isVisible={canScrollPrev}
              className={`prev-${toSlug(title)}`}
            />

            <div className={styles.ContentsWrapper} ref={emblaRef}>
              <div className={`${styles.ContentsContainer} ${isGrabing && styles.IsGrabing}`}>
                {sortedData.map((episode, index) => (
                  <CarouselItem
                    key={index}
                    episode={episode}
                    index={index}
                    activeIndex={activeIndex}
                    shiftPressed={shiftPressed}
                    enableShiftDelete={enableShiftDelete}
                    getProgressForEpisode={getProgressForEpisode}
                    getEpisodeCover={getEpisodeCover}
                    getAnimeTitle={getAnimeTitle}
                    getAnimeUrl={getAnimeUrl}
                    getEpisodeSubTitle={getEpisodeSubTitle}
                    getEpisodeTitle={getEpisodeTitle}
                    currentLanguage={currentLanguage}
                    isSeason={isSeason}
                    onClick={handleClick}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    isGrabing={isGrabing}
                    contentType={contentType}
                  />
                ))}
              </div>
            </div>

            <CarouselNavigation
              direction="next"
              onClick={scrollNext}
              isVisible={canScrollNext}
              className={`next-${toSlug(title)}`}
            />
          </div>
        )
      ) : (
        <div className={styles.ResultNone}>
          <p className={styles.ResultNoneMessage}>Aucun épisode disponible</p>
        </div>
      )}
    </div>
  )
}

export default ContentsCarousel
