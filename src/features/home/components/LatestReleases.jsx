import React from "react"
import { useNavigate } from "react-router-dom"
import { getRealEpisodeName } from "@utils/functions/getRealEpisodeName"
import { getRealChapterName } from "@utils/functions/getRealChapterName"
import { useLoader } from "@utils/dispatchers/Page"
import ContentsCarousel from "@components/contents-carousel/ContentsCarousel"

const LatestReleases = ({
  latestReleases,
  handleContentTypeChange,
  contentType,
  availableContentTypes,
}) => {
  const navigate = useNavigate()
  const { setLoading } = useLoader()
  const handleReleasesClick = async (releases) => {
    try {
      setLoading(true)
      if (contentType == "anime") {
        const { path, matchedEmbed, embedData, animeId, seasonId, seasonTitle } = await getRealEpisodeName(releases)
        const episodes = { [releases.language]: embedData }
        if (path) {
          navigate(path, {
            state: {
              episodeTitle: matchedEmbed.title,
              episodes: episodes,
              animeId,
              seasonId,
              animeTitle: releases.title,
              seasonTitle,
              animeCover: releases.cover,
              seasonUrl: releases.url,
              availableLanguages: [releases.language],
              selectedLanguage: releases.language,
            },
          })
        }
      } else {
        const { path, ChapterName, matchedEmbed, animeId, seasonId, seasonTitle } = await getRealChapterName(releases)
        const scansImg = await window.electron.ipcRenderer.invoke(
          "get-scans-img",
          releases.url,
          matchedEmbed,
        )

        if (path) {
          navigate(path, {
            state: {
              episodeTitle: matchedEmbed,
              scans: scansImg,
              animeId,
              seasonId,
              animeTitle: releases.title,
              seasonTitle,
              animeCover: releases.cover,
              seasonUrl: releases.url,
              availableLanguages: [releases.language],
              selectedLanguage: releases.language,
            },
          })
        }
      }

      setLoading(false)
    } catch (err) {
      setLoading(false)
      console.error("Erreur lors de la navigation :", err)
    }
  }

  return (
    <ContentsCarousel
      data={latestReleases}
      title="Dernières sorties"
      availableLanguageKey={"language"}
      onClickEpisode={handleReleasesClick}
      getEpisodeCover={(ep) => (ep.cover.startsWith("http") ? ep.cover : `http://${ep.cover}`)}
      getAnimeTitle={(ep) => ep.title}
      getEpisodeSubTitle={(ep) => ep.episode || ep.chapter}
      getAnimeUrl={(ep) => ep.url}
      isGridMode={false}
      onContentTypeChange={handleContentTypeChange}
      availableContentTypes={availableContentTypes}
      contentType={contentType}
    />
  )
}

export default LatestReleases
