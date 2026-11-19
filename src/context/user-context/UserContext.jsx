import { createContext, useCallback, useEffect, useMemo, useState } from "react"
import { supabase, getUserId } from "@services/supabase/Client"

export const UserContext = createContext(null)

const read = (key, fallback) => {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}
const write = (key, value) => {
  try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, String(value)) } catch {}
}

export const UserProvider = ({ children }) => {
  const [username, setUsername] = useState(() => read("username", "").trim() || "User")
  const [profileImage, setProfileImage] = useState(() => read("croppedProfileImage", null))
  const [theme, setTheme] = useState(() => read("theme", "dark"))
  const [colorTheme, setColorTheme] = useState(() => read("colorTheme", ""))
  const [toolBar, setToolBar] = useState(() => read("toolBar", "false") === "true")
  const [favoriteLanguage, setFavoriteLanguage] = useState(() => read("favoriteLanguage", "vostfr"))

  const updateUser = useCallback((name, image) => {
    const finalName = name?.trim() || "User"
    setUsername(finalName); setProfileImage(image ?? null)
    write("username", finalName); write("croppedProfileImage", image ?? null)
  }, [])
  const updateTheme = useCallback((v) => { setTheme(v); write("theme", v) }, [])
  const updateColorTheme = useCallback((v) => { setColorTheme(v); write("colorTheme", v) }, [])
  const updateToolBar = useCallback((v) => { setToolBar(!!v); write("toolBar", !!v) }, [])
  const updateFavoriteLanguage = useCallback((v) => { setFavoriteLanguage(v); write("favoriteLanguage", v) }, [])

  useEffect(() => {
    let cancelled = false
    const pull = async () => {
      const uid = await getUserId()
      if (!uid) return
      const { data, error } = await supabase.from("profiles").select("username, avatar_url").eq("id", uid).maybeSingle()
      if (cancelled || error || !data) return
      updateUser(data.username, data.avatar_url)
    }
    pull()
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") pull()
      if (event === "SIGNED_OUT") updateUser("User", null)
    })
    return () => { cancelled = true; sub.subscription.unsubscribe() }
  }, [updateUser])

  const value = useMemo(
    () => ({ username, profileImage, theme, colorTheme, toolBar, favoriteLanguage,
             updateUser, updateTheme, updateColorTheme, updateToolBar, updateFavoriteLanguage }),
    [username, profileImage, theme, colorTheme, toolBar, favoriteLanguage,
     updateUser, updateTheme, updateColorTheme, updateToolBar, updateFavoriteLanguage],
  )
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
