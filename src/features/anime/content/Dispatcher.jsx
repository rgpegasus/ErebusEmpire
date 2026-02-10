import React, { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useLoader, Loader, Episode, Scans } from "@utils/dispatchers/Page"

export const Dispatcher = () => {
  const { animeId, seasonId, episodeId } = useParams()
  if (seasonId.toLowerCase().includes("scan")) {
    console.log("scan")
    return <Scans animeId={animeId} seasonId={seasonId} episodeId={episodeId} />
  } else {
    console.log("episode")
    return <Episode animeId={animeId} seasonId={seasonId} episodeId={episodeId} />
  }
}
