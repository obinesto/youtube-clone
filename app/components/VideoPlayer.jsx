"use client";
import { useState, useEffect } from "react"

const VideoPlayer = ({ videoId }) => {
  const [hasWindow, setHasWindow] = useState(false)

  useEffect(() => {
    setHasWindow(true)
  }, [])

  if (!hasWindow) return null

  return (
    <div className="relative pt-[56.25%]">
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  )
}

export default VideoPlayer