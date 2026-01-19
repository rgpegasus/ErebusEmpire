import React from 'react';
import ImgLoader from '../../../img-loader/ImgLoader';
import ScrollTitle from '@components/scroll-title/ScrollTitle';
import { FlagDispatcher } from '@utils/dispatchers/Flags';
import { PlayIcon, ScanIcon } from '@utils/dispatchers/Icons';
import styles from '../../ContentsCarousel.module.css';
import { useNavigate } from 'react-router-dom';

const CarouselItem = ({
  episode,
  index,
  activeIndex, 
  shiftPressed,
  enableShiftDelete,
  getProgressForEpisode,
  getEpisodeCover,
  getAnimeTitle,
  getEpisodeSubTitle,
  getEpisodeTitle,
  getAnimeUrl,
  currentLanguage,
  isSeason,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isGrabing,
  contentType,
}) => {
  const navigate = useNavigate()
  const episodeTitle = getEpisodeTitle ? getEpisodeTitle(episode) : ""
  const numberValue = Number(episodeTitle)
  const isNumberStrict = !isNaN(numberValue) && episodeTitle.trim() === numberValue.toString()
  const displayTitle =
    isSeason && isNumberStrict
      ? `Chapitre ${episodeTitle}`
      : isSeason
        ? episodeTitle
        : getEpisodeSubTitle(episode)

  const [remainingMinutes, duration] = getProgressForEpisode(episode)
  const navigateAnime = (animeUrl) => {
    const Id = animeUrl.split("/").slice(4, 6).join("/")
    navigate(`/erebus-empire/${Id}`)
  }
  return (
    <div>
      <div
        className={`${styles.Item} ${
          index === activeIndex ? "" : activeIndex !== null && styles.NotActiveSlide
        } ${enableShiftDelete && shiftPressed && !isGrabing ? styles.ShiftDelete : ""} ${isGrabing && styles.IsGrabing}`}
        onClick={(e) => onClick(episode, e)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div
          className={`${styles.Cover} ${
            remainingMinutes >= 0 ? styles.CoverDuration : styles.CoverNoDuration
          }`}
        >
          <ImgLoader
            src={getEpisodeCover(episode)}
            key={`${getAnimeTitle(episode)} - ${getEpisodeSubTitle(episode)}`}
          />
        </div>

        <div className={styles.ElementsContainer}>
          {remainingMinutes >= 0 && (
            <div className={styles.RemainingMinutes}>
              {remainingMinutes < 1
                ? "Vu"
                : `${remainingMinutes}m restante${remainingMinutes > 1 ? "s" : ""}`}
            </div>
          )}

          {episode[currentLanguage] && !isSeason ? (
            <img
              className={styles.Language}
              src={FlagDispatcher(episode[currentLanguage])}
              alt="Language flag"
            />
          ) : (
            episode.selectedLanguage &&
            !isSeason && (
              <img
                className={styles.Language}
                src={FlagDispatcher(episode.selectedLanguage)}
                alt="Language flag"
              />
            )
          )}

          <div className={styles.Information}>
            <div
              onClick={(e) => {
                if (!isSeason && !isGrabing && !shiftPressed) {
                  e.stopPropagation()
                  navigateAnime(getAnimeUrl(episode))
                }
              }}
              className={`${styles.CoverTitle} ${getAnimeUrl && !isGrabing && !shiftPressed ? styles.TitleHover : ""}`}
            >
              <ScrollTitle title={getAnimeTitle(episode)} />
            </div>
            <div className={styles.CoverEpisodeTitle}>
              <ScrollTitle title={displayTitle} />
            </div>
          </div>

          <div
            className={`${styles.PlayIconContainer} ${
              index === activeIndex ? styles.PlayIconShow : ""
            }`}
          >
            {contentType === "anime" ? (
              <PlayIcon className={styles.PlayIcon} />
            ) : (
              <ScanIcon className={styles.PlayIcon} />
            )}
          </div>
        </div>

        {remainingMinutes >= 0 && (
          <div className={styles.ProgressBar}>
            <div className={styles.ProgressFill} style={{ width: `${duration}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}

export default CarouselItem;