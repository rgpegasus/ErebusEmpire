import React, { createContext, useCallback, useContext, useMemo, useState } from "react"
import { Loader } from "@features/loader/Loader"

const LoaderContext = createContext(null)

export const LoaderProvider = ({ children }) => {
  const [count, setCount] = useState(0)
  const setLoading = useCallback(
    (isLoading) => setCount((c) => (isLoading ? c + 1 : Math.max(c - 1, 0))),
    [],
  )
  const withLoading = useCallback(async (task) => {
    setLoading(true)
    try { return await task() } finally { setLoading(false) }
  }, [setLoading])

  const value = useMemo(() => ({ setLoading, withLoading, loading: count > 0 }), [setLoading, withLoading, count])
  return (
    <LoaderContext.Provider value={value}>
      {children}
      {count > 0 && <Loader />}
    </LoaderContext.Provider>
  )
}

export const useLoader = () => {
  const ctx = useContext(LoaderContext)
  if (!ctx) throw new Error("useLoader doit être utilisé à l'intérieur d'un LoaderProvider")
  return ctx
}
