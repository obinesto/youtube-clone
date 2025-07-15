"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import useUserStore from "@/hooks/useStore";
import { useAddToHistory } from "@/hooks/useQueries";

const VideoPlayer = ({ videoId }) => {
  const { isAPIReady, error: apiError } = useYouTubePlayer();
  const { isAuthenticated, user } = useUserStore();
  const addToHistory = useAddToHistory();

  const playerRef = useRef(null);
  const playerInstance = useRef(null);
  const prevVolume = useRef(100);
  const intervalRef = useRef(null);

  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 100,
    progress: 0,
  });

  const updatePlayerState = useCallback(() => {
    if (!playerInstance.current) return;

    try {
      const currentTime = playerInstance.current.getCurrentTime() || 0;
      const duration = playerInstance.current.getDuration() || 0;

      setPlayerState((prev) => ({
        ...prev,
        currentTime,
        duration,
        progress: (currentTime / duration) * 100,
      }));
    } catch (error) {
      console.error("Error updating player state:", error);
    }
  }, []);

  const startTimeUpdate = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(updatePlayerState, 1000);
  }, [updatePlayerState]);

  const stopTimeUpdate = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!playerInstance.current) return;

    if (playerState.isPlaying) {
      playerInstance.current.pauseVideo();
    } else {
      playerInstance.current.playVideo();
    }
  }, [playerState.isPlaying]);

  const handleVolumeChange = useCallback((newValue) => {
    if (!playerInstance.current) return;
    const volume = newValue[0];
    playerInstance.current.setVolume(volume);
    setPlayerState((prev) => ({ ...prev, volume }));
  }, []);

  const handleSeek = useCallback(
    (newValue) => {
      if (!playerInstance.current) return;
      const time = (newValue[0] / 100) * playerState.duration;
      playerInstance.current.seekTo(time, true);
    },
    [playerState.duration]
  );

  // Update initialization effect to be more stable
  useEffect(() => {
    if (!isAPIReady || !playerRef.current || apiError) return;

    // Only initialize if there is no player instance
    if (!playerInstance.current) {
      playerInstance.current = new window.YT.Player(playerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          controls: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event) => {
            const player = event.target;
            setPlayerState((prev) => ({
              ...prev,
              duration: player.getDuration(),
            }));
            player.setPlaybackQuality("auto");
          },
          onStateChange: (event) => {
            const isPlaying = event.data === window.YT.PlayerState.PLAYING;
            setPlayerState((prev) => ({ ...prev, isPlaying }));

            if (isPlaying) {
              startTimeUpdate();
            } else {
              stopTimeUpdate();
            }
            if (event.data === window.YT.PlayerState.ENDED) {
              setPlayerState((prev) => ({ ...prev, progress: 100 }));
            }
            if (isPlaying && isAuthenticated && user?.email) {
              addToHistory.mutate({ videoId });
            }
          },
        },
      });
    }

    return () => {
      stopTimeUpdate();
      // Only destroy player when component is actually unmounting
      if (playerInstance.current && !playerRef.current) {
        playerInstance.current.destroy();
        playerInstance.current = null;
      }
    };
  }, [isAPIReady, apiError]); // Reduce dependencies to only necessary ones to prevent unnecessary re-renders

  // Separate effect for handling video ID changes
  useEffect(() => {
    if (playerInstance.current && videoId && !apiError) {
      playerInstance.current.loadVideoById(videoId);
      setPlayerState((prev) => ({
        ...prev,
        currentTime: 0,
        progress: 0,
      }));
    }
  }, [videoId, apiError]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (apiError) {
    return (
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center text-white p-4">
        <Alert variant="destructive" className="w-full">
          <AlertTitle>Error Loading Video</AlertTitle>
          <AlertDescription>
            Error loading video player: {apiError.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAPIReady) {
    return (
      <div className="relative bg-black rounded-lg overflow-hidden">
        <div className="relative pt-[55%] sm:pt-[40%]">
          <Skeleton className="absolute top-0 left-0 w-full h-full" />
        </div>
      </div>
    );
  }

  const { currentTime, duration, volume, progress, isPlaying } = playerState;

  return (
    <div
      className="relative bg-black rounded-lg overflow-hidden group"
      role="region"
      aria-label="Video player"
    >
      <div className="relative pt-[55%] sm:pt-[40%]">
        <div
          id={`player-${videoId}`}
          ref={playerRef}
          className="absolute top-0 left-0 w-full h-full"
          aria-label="YouTube video player"
          role="application"
        />
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity"
        role="toolbar"
        aria-label="Video controls"
      >
        <Slider
          value={[progress]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="mb-4 [&_[role=slider]]:bg-customRed cursor-pointer"
          aria-label="Video progress"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              className="text-white hover:bg-white/20"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <span
              className="text-white text-sm"
              role="timer"
              aria-label="Video time"
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                handleVolumeChange([volume === 0 ? prevVolume.current : 0])
              }
              className="text-white hover:bg-white/20"
              aria-label={volume === 0 ? "Unmute" : "Mute"}
            >
              {volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            <div className="w-24">
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="[&_[role=slider]]:bg-white"
                aria-label="Volume"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const playerElement =
                  playerRef.current?.parentElement?.parentElement;
                if (playerElement) {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    playerElement.requestFullscreen();
                  }
                }
              }}
              className="text-white hover:bg-white/20"
              aria-label="Toggle fullscreen"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        {`Video ${isPlaying ? "playing" : "paused"} - ${formatTime(
          currentTime
        )} of ${formatTime(duration)}`}
      </div>
    </div>
  );
};

export default VideoPlayer;
