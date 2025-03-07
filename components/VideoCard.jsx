"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ThumbsUp, Clock, MoreVertical, Pencil, Trash2 } from "lucide-react";
import useUserStore from "@/hooks/useStore";
import { useProtectedFeatures } from "@/hooks/useProtectedFeatures";

const VideoCard = ({
  id,
  title,
  thumbnail,
  channelTitle,
  createdAt,
  views,
  duration,
  isOwner,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useUserStore();
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const {
    isLiked,
    isInWatchLater,
    handleLike,
    handleWatchLater,
    isLoadingLike,
    isLoadingWatchLater,
  } = useProtectedFeatures(id);

  const formattedDate = formatDate(createdAt);
  const formattedDuration = formatDuration(duration);
  const formattedViews = views ? parseInt(views).toLocaleString() : null;

  // Handle mouse enter/leave for video preview
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1`;
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
              queryKey: ["video", id],
              queryFn: () => useVideoDetails(id).queryFn(),
            });
          }
        });
      },
      { rootMargin: "50px" }
    );

    const element = document.getElementById(`video-card-${id}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [id, queryClient]);

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/studio/edit/${id}`);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Add confirmation dialog
    try {
      await queryClient
        .getMutationCache()
        .build()
        .execute({
          mutationKey: ["deleteVideo"],
          mutationFn: async () => {
            const response = await fetch("/api/videos", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ videoId: id }),
            });
            if (!response.ok) throw new Error("Failed to delete video");
          },
          onSuccess: () => {
            queryClient.invalidateQueries(["userVideos"]);
          },
        });
    } catch (error) {
      console.error("Failed to delete video:", error);
    }
  };

  return (
    <Link
      href={`/video/${id}`}
      id={`video-card-${id}`}
      className="block transition-transform hover:scale-[1.02] duration-200"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card className="overflow-hidden transition-shadow hover:shadow-lg group">
        <div className="relative aspect-video">
          {isHovered ? (
            <iframe
              ref={videoRef}
              className="w-full h-full absolute top-0 left-0"
              frameBorder="0"
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
          <h3 className="text-lg font-semibold line-clamp-2 hover:text-customRed">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{channelTitle}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            {formattedViews && <span>{formattedViews} views</span>}
            {formattedViews && formattedDate && <span>•</span>}
            {formattedDate && <span>{formattedDate}</span>}
          </div>
          {/* Video actions overlay */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`bg-black/80 hover:bg-black/90 ${
                    isLiked ? "text-customRed" : "text-white"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLike();
                    toast(
                      isLiked
                        ? "Removed from Liked videos"
                        : "Added to Liked videos"
                    );
                  }}
                  disabled={isLoadingLike}
                >
                  {isLoadingLike ? null : (
                    <ThumbsUp
                      className={`h-4 w-4 ${isLiked ? "fill-customRed" : ""}`}
                    />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`bg-black/80 hover:bg-black/90 ${
                    isInWatchLater ? "text-white" : "text-white"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleWatchLater();
                    toast(
                      isInWatchLater
                        ? "Removed from Watch Later"
                        : "Added to Watch Later"
                    );
                  }}
                  disabled={isLoadingWatchLater}
                >
                  {isLoadingWatchLater ? null : (
                    <Clock
                      className={`h-4 w-4 ${
                        isInWatchLater ? "fill-current" : ""
                      }`}
                    />
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
