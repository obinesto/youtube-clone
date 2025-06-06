"use client";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { formatDate, formatDuration } from "@/lib/utils/dateFormat";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import {
  ThumbsUp,
  Bookmark,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { PiShareFatBold } from "react-icons/pi";
import useUserStore from "@/hooks/useStore";
import { useProtectedFeatures } from "@/hooks/useProtectedFeatures";
import usePlayerStore from "@/hooks/usePlayerStore";

const VideoCard = ({
  videoId,
  title,
  thumbnail,
  channelTitle,
  createdAt,
  views,
  duration,
  watchedAt,
  savedAt,
  likedAt,
  isOwner,
}) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useUserStore();
  const { activePlayerId, setActivePlayer, clearActivePlayer } =
    usePlayerStore();
  const videoRef = useRef(null);
  const cardElementRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [updateLike, setUpdateLike] = useState(false);
  const [updateSavedVideo, setUpdateSavedVideo] = useState(false);

  const {
    isLiked,
    isSaved,
    handleLike,
    handleSavedVideo,
    isLoadingLike,
    isLoadingSavedVideo,
  } = useProtectedFeatures(videoId);

  const formattedDate = formatDate(createdAt);
  const formattedDuration = formatDuration(duration);
  const formattedViews = views ? parseInt(views).toLocaleString() : null;

  useEffect(() => {
    // Determine if it's a small screeen on mount and on window resize
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768); // Breakpoint for "small screen"
    };

    if (typeof window !== "undefined") {
      checkScreenSize();
      window.addEventListener("resize", checkScreenSize);
      return () => window.removeEventListener("resize", checkScreenSize);
    }
  }, []);

  // Effect to set isHovered on small screens based on scroll position
  useEffect(() => {
    const element = cardElementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const isWithinActivationZone =
        rect.top < viewportHeight * 0.5 &&
        rect.bottom > 0 &&
        rect.top < viewportHeight;

      if (isSmallScreen) {
        // Only update if the state needs to change
        setIsHovered((currentIsHovered) => {
          if (isWithinActivationZone && !currentIsHovered) return true;
          if (!isWithinActivationZone && currentIsHovered) return false;
          return currentIsHovered;
        });
      } else {
        setIsHovered(false);
      }
    };

    if (typeof window !== "undefined") {
      handleScroll();
      window.addEventListener("scroll", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll);
        // Ensure isHovered is false when cleaning up if it was set by this effect
        if (isSmallScreen) setIsHovered(false);
      };
    }
  }, [isSmallScreen, videoId]);

  // Prefetch and cache video data
  useEffect(() => {
    if (!videoId) return;
    const element = document.getElementById(`video-card-${videoId}`);
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            queryClient.prefetchQuery({
              queryKey: ["video", videoId],
              queryFn: async () => {
                if (!videoId)
                  throw new Error("Video ID is required for prefetch");
                const response = await axiosInstance.get("/videos", {
                  params: {
                    part: "snippet,statistics,contentDetails",
                    id: videoId,
                  },
                });
                if (!response.data?.items?.length) {
                  throw new Error("Video not found during prefetch");
                }
                return response.data.items[0];
              },
            });
          }
        });
      },
      {
        rootMargin: "50px",
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [videoId, queryClient, isSmallScreen]);

  // Effect to manage which video is the active player in the global store
  useEffect(() => {
    if (isHovered) {
      setActivePlayer(videoId);
    } else {
      if (usePlayerStore.getState().activePlayerId === videoId) {
        clearActivePlayer(videoId);
      }
    }
  }, [isHovered, videoId, setActivePlayer, clearActivePlayer]);

  // Effect to handle cleanup when the component unmounts or its videoId prop changes.
  useEffect(() => {
    const currentVideoId = videoId;
    return () => {
      if (usePlayerStore.getState().activePlayerId === currentVideoId) {
        clearActivePlayer(currentVideoId);
      }
    };
  }, [videoId, clearActivePlayer]);

  // Effect to handle actual video playback based on local hover state and global active player
  useEffect(() => {
    const iframeElement = videoRef.current;
    if (!iframeElement) return;

    // Play only if this card is locally hovered/intersected AND it's the globally active one
    const canPlay = isHovered && activePlayerId === videoId;

    if (canPlay) {
      iframeElement.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1`;
    } else {
      iframeElement.src = ""; // Stop playback
    }

    // Cleanup function to stop the video if conditions change or component unmounts
    return () => {
      if (iframeElement) {
        iframeElement.src = "";
      }
    };
  }, [isHovered, videoId, activePlayerId]);

  // Quietly update like and saved video button after clicking
  useEffect(() => {
    setUpdateLike(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setUpdateSavedVideo(isSaved);
  }, [isSaved]);

  const shouldShowVideo = isHovered && activePlayerId === videoId;

  return (
    <Link
      href={`/video/${videoId}/${channelTitle}`}
      ref={cardElementRef}
      id={`video-card-${videoId}`}
      className="block transition-transform hover:scale-[1.02] duration-200"
      onMouseEnter={!isSmallScreen ? () => setIsHovered(true) : undefined}
      onMouseLeave={!isSmallScreen ? () => setIsHovered(false) : undefined}
    >
      <Card className="h-[375px] md:h-[345px] overflow-hidden transition-shadow hover:shadow-lg relative">
        <div className="relative aspect-video">
          {shouldShowVideo ? (
            <iframe
              ref={videoRef}
              className="w-full h-full absolute top-0 left-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={`Video preview: ${title || "Video"}`}
              allowFullScreen
            />
          ) : (
            <img
              src={thumbnail || "/placeholder.svg"}
              alt={title || "Video thumbnail"}
              className="object-cover w-full h-full"
              loading="lazy"
            />
          )}
          {formattedDuration && !shouldShowVideo && (
            <div className="absolute bottom-2 right-2 px-1 py-0.5 bg-black/80 text-white text-xs rounded">
              {formattedDuration}
            </div>
          )}

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white p-1 h-auto w-auto rounded-full z-10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    /* handleEdit logic */
                    toast("Edit action triggered (implement me!)");
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    /* handleDelete logic */
                    toast("Delete action triggered (implement me!)");
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="text-xlg font-semibold line-clamp-2 hover:text-customRed">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{channelTitle}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            {formattedViews && <span>{formattedViews} views</span>}
            {formattedViews && formattedDate && <span>•</span>}
            {formattedDate && <span>{formattedDate}</span>}
          </div>
          {watchedAt && (
            <span className="text-sm text-muted-foreground">
              Watched {formatDate(watchedAt)}
            </span>
          )}
          {savedAt && (
            <span className="text-sm text-muted-foreground">
              Saved {formatDate(savedAt)}
            </span>
          )}
          {likedAt && (
            <span className="text-sm text-muted-foreground">
              Liked {formatDate(likedAt)}
            </span>
          )}

          {/* Video actions */}
          <div
            className={
              isAuthenticated
                ? "absolute bottom-0 right-0 flex items-center w-full justify-between"
                : "absolute bottom-0 right-6 flex items-center w-full justify-end"
            }
          >
            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`hover:text-customRed ${
                    updateLike ? "text-customRed" : ""
                  }`}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setUpdateLike((prev) => !prev);

                    try {
                      await handleLike();
                    } catch (error) {
                      toast(error.message);
                      setUpdateLike((prev) => !prev);
                    }
                  }}
                  disabled={isLoadingLike}
                >
                  {isLoadingLike ? null : (
                    <ThumbsUp
                      className={`h-4 w-4 ${
                        updateLike ? "fill-customRed" : ""
                      }`}
                    />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`hover:text-customRed ${
                    updateSavedVideo ? "text-customRed" : ""
                  }`}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setUpdateSavedVideo((prev) => !prev);
                    try {
                      await handleSavedVideo();
                    } catch (error) {
                      console.error(
                        "Error updating saved video status:",
                        error
                      );
                      toast(
                        error.message || "Failed to update saved video status."
                      );
                      setUpdateSavedVideo((prev) => !prev);
                    }
                  }}
                  disabled={isLoadingSavedVideo}
                >
                  {isLoadingSavedVideo ? null : (
                    <Bookmark
                      className={`h-4 w-4 ${
                        updateSavedVideo ? "fill-customRed" : ""
                      }`}
                    />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:text-customRed"
                  disabled={isLoadingSavedVideo || isLoadingLike}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigator.clipboard.writeText(
                      `${window.location.origin}/video/${videoId}/${channelTitle}`
                    );
                    toast("Link copied to clipboard");
                  }}
                >
                  {isLoadingSavedVideo || isLoadingLike ? null : (
                    <>
                      <PiShareFatBold className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:text-customRed"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigator.clipboard.writeText(
                      `${window.location.origin}/video/${videoId}/${channelTitle}`
                    );
                    toast("Link copied to clipboard");
                  }}
                >
                  <Card className="flex items-center gap-2 py-1 px-2 rounded-full">
                    <span>share</span>
                    <PiShareFatBold className="h-4 w-4" />
                  </Card>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default VideoCard;
