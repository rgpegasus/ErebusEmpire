import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { getRealEpisodeName } from "@utils/functions/getRealEpisodeName"
import { getRealChapterName } from "@utils/functions/getRealChapterName"
import { useLoader } from "@context/loader-context/LoaderContext"
import ContentsCarousel from "@components/contents-carousel/ContentsCarousel"

const LatestReleases = ({
  latestReleases,
  handleContentTypeChange,
  contentType,
  availableContentTypes,
  availableLanguages,
  selectedLanguage,
  handleLanguageChange,
}) => {
  const navigate = useNavigate()
  const { withLoading } = useLoader()
  const [error, setError] = useState(null)
  const [searchValue, setSearchValue] = useState("")
  const handleReleasesClick = async (release) => {
    try {
      await withLoading(async () => {
        const common = {
          animeTitle: release.title,
          animeCover: release.cover,
          seasonUrl: release.url,
          availableLanguages: [release.language],
          selectedLanguage: release.language,
        }
        if (contentType === "anime") {
          const found = await getRealEpisodeName(release)
          if (!found) return setError("Épisode introuvable pour le moment.")
          navigate(found.path, {
            state: {
              ...common,
              episodeTitle: found.matchedEmbed.title,
              episodes: { [release.language]: found.embedData },
              animeId: found.animeId,
              seasonId: found.seasonId,
              seasonTitle: found.seasonTitle,
            },
          })
        } else {
          const found = await getRealChapterName(release)
          if (!found) return setError("Chapitre introuvable pour le moment.")
          const scans = await window.api.invoke(
            "get-scans-img", release.url, found.matchedChapter.id,
            found.matchedChapter.numberImg, found.encodedTitle,
          )
          navigate(found.path, {
            state: {
              ...common,
              episodeTitle: found.matchedChapter.title,
              chapterId: found.matchedChapter.id,
              scans,
              animeId: found.animeId,
              seasonId: found.seasonId,
              seasonTitle: found.seasonTitle,
            },
          })
        }
      })
    } catch (err) {
      console.error("Erreur lors de la navigation :", err)
      setError("Impossible d'ouvrir cette sortie.")
    }
  }

  return (
    <>
    {error && <div role="alert" className="InlineError" onClick={() => setError(null)}>{error}</div>}
    <ContentsCarousel
      data={latestReleases}
      title="Dernières sorties"
      availableLanguageKey={"language"}
      onClickEpisode={handleReleasesClick}
      getEpisodeCover={(ep) => (ep.cover?.startsWith("http") ? ep.cover : `https://${ep.cover}`)}
      getAnimeTitle={(ep) => ep.title}
      getEpisodeSubTitle={(ep) => ep.episode || ep.chapter}
      getAnimeUrl={(ep) => ep.url}
      isGridMode={false}
      onContentTypeChange={handleContentTypeChange}
      availableContentTypes={availableContentTypes}
      contentType={contentType}
      availableLanguages={availableLanguages}
      currentLanguage={selectedLanguage}
      onLanguageChange={handleLanguageChange}
      searchValue={searchValue}
      setSearchValue={setSearchValue}
    />
    </>
  )
}

export default LatestReleases
