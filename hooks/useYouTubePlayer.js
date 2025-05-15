"use client";
import { useState, useEffect } from "react";

export function useYouTubePlayer() {
  const [isAPIReady, setIsAPIReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Check if YT API is already loaded
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    // Define the callback before loading the script
    window.onYouTubeIframeAPIReady = () => {
      if (isMounted) {
        setIsAPIReady(true);
      }
    };

    // Load the IFrame Player API code asynchronously
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    tag.onerror = () => {
      if (isMounted) {
        console.error("Failed to load YouTube IFrame API");
        setError(new Error("Failed to load YouTube IFrame API"));
      }
    };

    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    return () => {
      isMounted = false;
    };
  }, []);

  return { isAPIReady, error };
}
