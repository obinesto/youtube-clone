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
  Share2,
} from "lucide-react";
import useUserStore from "@/hooks/useStore";
import { useProtectedFeatures } from "@/hooks/useProtectedFeatures";

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
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
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

  // Prefetch video data when card comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            queryClient.prefetchQuery({
              queryKey: ["video", videoId],
              queryFn: async () => {
                if (!videoId) throw new Error("Video ID is required for prefetch");
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
      { rootMargin: "50px" }
    );

    const element = document.getElementById(`video-card-${videoId}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [videoId, queryClient]);

  // Effect to handle video playback on hover
  useEffect(() => {
    const iframeElement = videoRef.current; // Capture the element for this effect instance

    if (isHovered && iframeElement) {
      iframeElement.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1`;
      
      // Cleanup function to stop the video when hover ends or component unmounts
      return () => {
        if (iframeElement) {
          iframeElement.src = "";
        }
      };
    }
  }, [isHovered, videoId]);

  // Quietly update like and saved video button after clicking
  useEffect(() => {
    setUpdateLike(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setUpdateSavedVideo(isSaved);
  }, [isSaved]);

  return (
    <Link
      href={`/video/${videoId}`}
      id={`video-card-${videoId}`}
      className="block transition-transform hover:scale-[1.02] duration-200"
      onMouseEnter= {() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="h-[375px] md:h-[345px] overflow-hidden transition-shadow hover:shadow-lg relative">
        <div className="relative aspect-video">
          {isHovered ? (
            <iframe
              ref={videoRef}
              className="w-full h-full absolute top-0 left-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={`Video preview: ${title || 'Video'}`}
               allowFullScreen
            />
          ) : (
            <img
              src={thumbnail || "/placeholder.svg"}
              alt={title}
              className="object-cover w-full h-full"
              loading="lazy"
            />
          )}
          {formattedDuration && !isHovered && (
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
                  className="bg-black/80 hover:bg-black text-white"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
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
          <div className="absolute bottom-0 right-0 flex items-center w-full justify-between">
            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`hover:text-customRed ${updateLike ? "text-customRed" : ""}`}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setUpdateLike(prev => !prev);

                    try {
                      await handleLike();
                    } catch (error) {
                      toast(error.message);
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
                 className={`hover:text-customRed ${updateSavedVideo? "text-customRed" : ""}`}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setUpdateSavedVideo(prev => !prev);
                    try {
                      await handleSavedVideo();
                    } catch (error) {
                      console.error("Error updating saved video status:", error);
                      toast(
                        error.message || "Failed to update saved video status."
                      );
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
                      `https://youtube-clone-cyprianobi.vercel.app/video/${videoId}`
                    );
                    toast("Link copied to clipboard");
                  }}
                >
                  {isLoadingSavedVideo || isLoadingLike ? null : (
                    <Share2 className="h-4 w-4" />
                  )}
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
