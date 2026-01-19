import React, { useState } from 'react';
import { GridModeIcon, CarouselModeIcon, SortIcon, SearchIcon } from '@utils/dispatchers/Icons';
import { FlagDispatcher } from '@utils/dispatchers/Flags';
import styles from '../../ContentsCarousel.module.css';

const CarouselHeader = ({
  data,
  isAscending,
  setIsAscending,
  isSeason,
  currentLanguage,
  availableLanguages,
  onLanguageChange,
  gridMode,
  setGridMode,
  searchValue,
  setSearchValue,
  onContentTypeChange,
  availableContentTypes,
  contentType,
  customType,
  customSearch,
}) => {
  const handleContentTypeToggle = () => {
    if (availableContentTypes.hasAnime && availableContentTypes.hasManga) {
      const newType = contentType === "anime" ? "manga" : "anime"
      onContentTypeChange(newType)
    }
  }

  const getContentTypeDisplay = () => {
    if (customType) {
      return customType
    } else if (!availableContentTypes.hasAnime && availableContentTypes.hasManga) {
      return "Manga"
    } else if (availableContentTypes.hasAnime && !availableContentTypes.hasManga) {
      return "Anime"
    } else {
      return contentType === "anime" ? "Anime" : "Manga"
    }
  }

  return (
    <div className={styles.ActionsContainer}>
      <div className={styles.ActionsElements}>
        <div className={styles.SortContainer} onClick={() => setGridMode(!gridMode)}>
          {gridMode ? (
            <CarouselModeIcon className={styles.ActionsIcons} />
          ) : (
            <GridModeIcon className={styles.ActionsIcons} />
          )}
        </div>

        {(availableContentTypes.hasAnime || availableContentTypes.hasManga) && (
          <div
            className={`${styles.SortContainer} ${!availableContentTypes.hasAnime || !availableContentTypes.hasManga ? styles.NoHover : ""}`}
            onClick={handleContentTypeToggle}
          >
            <h2 className={styles.ActionsTitle}>{getContentTypeDisplay()}</h2>
          </div>
        )}

        <h2 className={`${styles.ActionsTitle} ${styles.NoHover}`}>
          {data.length === 0
            ? `Aucun ${getContentTypeDisplay() === "Anime" ? "épisode" : "chapitre"}`
            : `${!customType.startsWith("~~") ? data.length : ""} ${
                getContentTypeDisplay() === customType && !customType.startsWith("~")
                  ? customType
                  : customType && customType.startsWith("~~")
                    ? customType.slice(2)
                    : customType && customType.startsWith("~")
                      ? customType.slice(1)
                      : "Anime"
                        ? "Episode"
                        : "Chapitre"
              }${data.length > 1 && !customType.startsWith("~") ? "s" : ""}`}
        </h2>

        <div
          className={styles.SortContainer}
          onClick={() => setIsAscending(!isAscending)}
          style={{ cursor: "pointer" }}
        >
          <SortIcon className={styles.ActionsIcons} />
          <h2 className={styles.ActionsTitle}>
            {isAscending
              ? customType
                ? "A → Z"
                : "Les + récents"
              : customType
                ? "Z → A"
                : "Les + anciens"}
          </h2>
        </div>

        <div className={styles.SortContainer}>
          <SearchIcon className={styles.ActionsIcons} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className={styles.SearchInput}
          />
        </div>
      </div>

      {availableLanguages.length > 0 && isSeason && (
        <div className={styles.FlagsContainer}>
          {`Langue${availableLanguages.length > 1 ? "s" : ""} :`}
          {availableLanguages.map((lang, index) => {
            const flag = FlagDispatcher(lang.toLowerCase())
            return (
              <span key={index}>
                {flag && (
                  <img
                    onClick={() => onLanguageChange(lang)}
                    src={flag}
                    alt={lang}
                    draggable="false"
                    className={`${styles.Flag} ${
                      currentLanguage === lang.toLowerCase() ? styles.Selected : ""
                    }`}
                  />
                )}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CarouselHeader;