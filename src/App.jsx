import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import ToolBar from '@layouts/tool-bar/ToolBar';
import TopBar from '@layouts/top-bar/TopBar';
import Theme from '@layouts/theme/Theme'
import { Catalog, Home, Download, Season, Dispatcher, Settings, Login, Favorites, Watchlist, History, OnHold, AlreadySeen, Profile, NotFound } from '@utils/dispatchers/Page';
import { supabase } from "@services/supabase/Client"
import { useLoader, Loader } from "@utils/dispatchers/Page"
const Logger = () => {
  const location = useLocation();
  console.log("🧭 Chemin actuel :", location.pathname + location.search);
  return null;
};

const App = () => {
  const [showTheme, setShowTheme] = useState(false)
  const openTheme = () => setShowTheme(true)
  const closeTheme = () => setShowTheme(false)
  const navigate = useNavigate()
  const [authReady, setAuthReady] = useState(false)
  
  let globalTime = Number(localStorage.getItem("usageTime") || 0)
  useEffect(() => {
    window.electron.ipcRenderer.on("log-from-main", (_, msg) => {
      console.log("[FROM MAIN]", msg)
    })
  }, [])

  async function isUserLoggedIn() {
    const { data: userData } = await supabase.auth.getUser()
    return !!userData?.user
  }
  let userId = null

  const init = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return
    userId = userData.user.id
  }

  init()
  useEffect(() => {
    const verifUsername = async () => {
      const loggedIn = await isUserLoggedIn()
      if (!loggedIn || !authReady ) return
      const { data : dataUsername, error : errorUsername } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single()
      if (!errorUsername) {
        const username = dataUsername?.username ?? ""
        if (username !== null && username.length > 0 && username != localStorage.getItem("username")) {
          localStorage.setItem("username", username)
        }
      } 
      const fileName = `${userId}/avatar.png`

      const { data, error } = await supabase.storage
        .from("avatars")
        .getPublicUrl(fileName)
      if(!error) {
        const avatarUrl = data.publicUrl
        if (avatarUrl !== null && avatarUrl.length > 0 && avatarUrl != localStorage.getItem("croppedProfileImage")) {
          localStorage.setItem("croppedProfileImage", avatarUrl)
        }
      }
    }
    verifUsername()
  }, [authReady])

  useEffect(() => {
    if (!authReady) return
    const pendingTime = localStorage.getItem("pendingTime")
    if(pendingTime == null) {
      localStorage.setItem("initTimer", "true")
    }
    let sessionTime = pendingTime !== null ? Number(pendingTime) : Number(localStorage.getItem("usageTime") || 0)


    const localTime = setInterval(() => {
      sessionTime += 1
      localStorage.setItem("pendingTime", String(sessionTime))
      if (localStorage.getItem("initTimer") === "false") {
        localStorage.setItem("usageTime", globalTime + sessionTime)
      } else {
        localStorage.setItem("usageTime", sessionTime)
      }
    }, 1000)

    const supabaseSync = setInterval(async () => {
      init()
      if (!userId || sessionTime === 0) return

      const toSync = sessionTime
      sessionTime = 0
      localStorage.setItem("pendingTime", "0")

      const { data, error: selectError } = await supabase
        .from("profiles")
        .select("usageTime")
        .eq("id", userId)
        .single() 

      if (selectError) {
        console.error("Erreur fetch usageTime:", selectError)
        sessionTime = toSync
        localStorage.setItem("pendingTime", String(toSync))
        return
      }

      const newTotal = (data?.usageTime || 0) + toSync
      globalTime = newTotal
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ usageTime: newTotal })
        .eq("id", userId)

      if (updateError) {
        console.error("Erreur update usageTime:", updateError)
        sessionTime = toSync
        localStorage.setItem("pendingTime", String(toSync))
      } else {
        localStorage.setItem("initTimer", "false")
      }
    }, 60000)

    return () => {
      clearInterval(localTime)
      clearInterval(supabaseSync)
    }
  }, [authReady])

  const DeepLinkHandler = () => {
    const navigate = useNavigate()

    useEffect(() => {
      if (window.deeplinkAPI) {
        window.deeplinkAPI.onDeepLink((url) => {
          const path = url.replace("erebusempire://", "")
          navigate(`/${path}`)
        })
      }
    }, [navigate])

    return null
  }

  useEffect(() => {
    const initSupabaseSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        window.electron?.ipcRenderer?.invoke("set-supabase-session", session)
      } else {
        console.log("Aucune session Supabase")
      }
      setAuthReady(true)
    }

    initSupabaseSession()
  }, [])
  useEffect(() => {
    const isShowingLoginPage = async () => {
      const loggedIn = await isUserLoggedIn()
      if (!loggedIn) {
        const numberStartErebus = localStorage.getItem("numberStartErebus")

        if (!numberStartErebus || Number(numberStartErebus) >= 50) {
          localStorage.setItem("numberStartErebus", "0")
          navigate("/erebus-empire/login")
        } else {
          localStorage.setItem("numberStartErebus", String(Number(numberStartErebus) + 1))
        }
      }
    }
    isShowingLoginPage()
  }, [])
  if (!authReady) {
    return <Loader />
  }

  return (
    <div>
      <ToolBar />
      {/* <LoginPage/> */}
      <Logger />
      <Theme visible={showTheme} onClose={closeTheme} />
      <DeepLinkHandler />
      <div>
        <TopBar />
        <Routes>
          <Route path="/" element={<Navigate to="/erebus-empire/home" replace />} />
          <Route path="/erebus-empire/home" element={<Home />} />
          <Route path="/erebus-empire/catalog" element={<Catalog />} />
          <Route path="/erebus-empire/downloads" element={<Download />} />
          <Route path="/erebus-empire/:animeId/:seasonId?" element={<Season />} />
          <Route
            path="/erebus-empire/:animeId/:seasonId/:episodeId"
            element={<Dispatcher key={location.pathname} />}
          />
          <Route path="/erebus-empire/settings" element={<Settings openTheme={openTheme} />} />
          <Route path="/erebus-empire/settings/profile" element={<Profile />} />
          <Route path="/erebus-empire/login" element={<Login />} />
          <Route path="/erebus-empire/favorites" element={<Favorites />} />
          <Route path="/erebus-empire/watchlist" element={<Watchlist />} />
          <Route path="/erebus-empire/history" element={<History />} />
          <Route path="/erebus-empire/onHold" element={<OnHold />} />
          <Route path="/erebus-empire/alreadySeen" element={<AlreadySeen />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  )
}

export default App;
