import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export function useDeepLink() {
  const navigate = useNavigate()
  useEffect(() => window.api.on("deep-link", (route) => navigate(route)), [navigate])
}
