import { useEffect, useState } from "react"
import { supabase } from "@services/supabase/Client"
import { syncLocalToAccount } from "@services/data/animeRepository"


export function useAuth() {
  const [state, setState] = useState({ ready: false, session: null })

  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(({ data }) => alive && setState({ ready: true, session: data.session }))

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ ready: true, session })
      if (event === "SIGNED_IN") syncLocalToAccount().catch((e) => console.warn("[sync]", e.message))
    })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])

  return { ...state, isLoggedIn: !!state.session, user: state.session?.user ?? null }
}
