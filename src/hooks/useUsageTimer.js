import { useEffect } from "react"
import { supabase, getUserId } from "@services/supabase/Client"

const FLUSH_EVERY_MS = 60_000
const LS_TOTAL = "usageTime"    
const LS_PENDING = "pendingSeconds" 

const num = (k) => Number(localStorage.getItem(k) || 0)

export function useUsageTimer(enabled) {
  useEffect(() => {
    if (!enabled) return
    let flushing = false

    const tick = setInterval(() => {
      if (document.visibilityState !== "visible") return
      localStorage.setItem(LS_PENDING, String(num(LS_PENDING) + 1))
      localStorage.setItem(LS_TOTAL, String(num(LS_TOTAL) + 1))
    }, 1000)

    const flush = async () => {
      const pending = num(LS_PENDING)
      if (flushing || pending <= 0 || !(await getUserId())) return
      flushing = true
      try {
        const { data, error } = await supabase.rpc("add_usage_time", { seconds: pending })
        if (error) throw error
        localStorage.setItem(LS_PENDING, String(Math.max(0, num(LS_PENDING) - pending)))
        if (typeof data === "number") localStorage.setItem(LS_TOTAL, String(data))
      } catch (e) {
        console.warn("[usage] synchro reportée :", e.message)
      } finally {
        flushing = false
      }
    }

    const sync = setInterval(flush, FLUSH_EVERY_MS)
    const onHide = () => document.visibilityState === "hidden" && flush()
    window.addEventListener("beforeunload", flush)
    document.addEventListener("visibilitychange", onHide)
    return () => {
      clearInterval(tick); clearInterval(sync)
      window.removeEventListener("beforeunload", flush)
      document.removeEventListener("visibilitychange", onHide)
    }
  }, [enabled])
}
