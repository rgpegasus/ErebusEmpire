import React, { Suspense, lazy, useState } from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import ToolBar from "@layouts/tool-bar/ToolBar"
import TopBar from "@layouts/top-bar/TopBar"
import Theme from "@layouts/theme/Theme"
import { Loader } from "@features/loader/Loader"
import { useAuth } from "@hooks/useAuth"
import { useUsageTimer } from "@hooks/useUsageTimer"
import { useDeepLink } from "@hooks/useDeepLink"
import { useNewEpisodeNotifications } from "@hooks/useNewEpisodeNotifications"
import { Home } from "@features/home/Home"

const named = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })))
const Catalog = named(() => import("@features/catalog/Catalog"), "Catalog")
const Download = named(() => import("@features/download/Download"), "Download")
const Season = named(() => import("@features/anime/season/Season"), "Season")
const Dispatcher = named(() => import("@features/anime/content/Dispatcher"), "Dispatcher")
const Settings = named(() => import("@features/settings/Settings"), "Settings")
const Profile = named(() => import("@features/settings/navigations/Profile"), "Profile")
const Login = named(() => import("@features/account/Login"), "Login")
const NotFound = named(() => import("@features/not-found/NotFound"), "NotFound")
const AnimeLibrary = named(() => import("@features/user-data/components/AnimeLibrary"), "AnimeLibrary")

const LIBRARIES = {
  favorites:   { storageKey: "animeFavorites",    title: "Animés & Scans Favoris :",       customType: "Favori" },
  watchlist:   { storageKey: "animeWatchlist",    title: "Animés & Scans à Regarder :",    customType: "~à Regarder" },
  history:     { storageKey: "animeWatchHistory", title: "Animés & Scans en Cours :",      customType: "~en Cours", sort: true },
  onHold:      { storageKey: "animeOnHold",       title: "Animés & Scans en Attente :",    customType: "~en Attente" },
  alreadySeen: { storageKey: "animeAlreadySeen",  title: "Animés & Scans déjà vus :",      customType: "Terminé" },
}

export default function App() {
  const [showTheme, setShowTheme] = useState(false)
  const location = useLocation()
  const { ready, isLoggedIn } = useAuth()

  useUsageTimer(ready && isLoggedIn)
  useNewEpisodeNotifications(ready)
  useDeepLink()

  if (!ready) return <Loader />

  return (
    <div>
      <ToolBar />
      <Theme visible={showTheme} onClose={() => setShowTheme(false)} />
      <TopBar />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/erebus-empire/home" replace />} />
          <Route path="/erebus-empire/home" element={<Home />} />
          <Route path="/erebus-empire/catalog" element={<Catalog />} />
          <Route path="/erebus-empire/downloads" element={<Download />} />
          <Route path="/erebus-empire/settings" element={<Settings openTheme={() => setShowTheme(true)} />} />
          <Route path="/erebus-empire/settings/profile" element={<Profile />} />
          <Route path="/erebus-empire/login" element={<Login />} />
          {Object.entries(LIBRARIES).map(([path, props]) => (
            <Route key={path} path={`/erebus-empire/${path}`} element={<AnimeLibrary {...props} />} />
          ))}
          <Route path="/erebus-empire/:animeId/:seasonId?" element={<Season />} />
          <Route
            path="/erebus-empire/:animeId/:seasonId/:episodeId"
            element={<Dispatcher key={location.pathname} />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  )
}
