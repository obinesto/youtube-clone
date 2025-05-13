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
import { useVideoDetails } from "@/hooks/useQueries";
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
  isOwner,
}) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useUserStore();
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [updateLike, setUpdateLike] = useState(false);
  const [updateWatchLater, setUpdateWatchLater] = useState(false);

  const {
    isLiked,
    isInWatchLater,
    handleLike,
    handleWatchLater,
    isLoadingLike,
    isLoadingWatchLater,
  } = useProtectedFeatures(videoId);

  const formattedDate = formatDate(createdAt);
  const formattedDuration = formatDuration(duration);
  const formattedViews = views ? parseInt(views).toLocaleString() : null;

  // Handle mouse enter/leave for video preview
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1`;
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.src = "";
    }
  };

  // Prefetch video data when card comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            queryClient.prefetchQuery({
              queryKey: ["video", videoId],
              queryFn: () => useVideoDetails(videoId).queryFn(),
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

  // Quietly update like and watch later button when clicked
  useEffect(() => {
    setUpdateLike(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setUpdateWatchLater(isInWatchLater);
  }, [isInWatchLater]);

  return (
    <Link
      href={`/video/${videoId}`}
      id={`video-card-${videoId}`}
      className="block transition-transform hover:scale-[1.02] duration-200"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card className="h-[320px] overflow-hidden transition-shadow hover:shadow-lg relative">
        <div className="relative aspect-video">
          {isHovered ? (
            <iframe
              ref={videoRef}
              className="w-full h-full absolute top-0 left-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
          {/* Video actions */}
          <div className="absolute bottom-0 right-0 flex items-center w-full justify-between ">
            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:text-customRed"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setUpdateLike(!isLiked); // Optimistic update

                    try {
                      await handleLike();
                    } catch (error) {
                      toast(error.message);
                      setUpdateLike(isLiked); // Revert optimistic update
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
                  className="hover:text-customRed"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setUpdateWatchLater(!isInWatchLater); // Optimistic update

                    try {
                      await handleWatchLater();
                    } catch (error) {
                      console.error("Error updating watch later:", error);
                      toast(error.message || "Failed to update watch later status.");
                      setUpdateWatchLater(isInWatchLater); // Revert optimistic update
                    }
                  }}
                  disabled={isLoadingWatchLater}
                >

                  {isLoadingWatchLater ? null : (
                    <Bookmark
                      className={`h-4 w-4 ${
                        updateWatchLater ? "fill-customRed" : ""
                      }`}
                    />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:text-customRed"
                  disabled={isLoadingWatchLater || isLoadingLike}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigator.clipboard.writeText(
                      `https://youtube-clone-cyprianobi.vercel.app/video/${videoId}`
                    );
                    toast("Link copied to clipboard");
                  }}
                >
                  {isLoadingWatchLater || isLoadingLike ? null : (
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
