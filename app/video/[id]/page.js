"use client";
import { useVideoDetails } from "@/hooks/useQueries";
import VideoPlayer from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { use } from "react";
import useUserStore from "@/hooks/useStore";
import { ThumbsUp, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { useProtectedFeatures } from "@/hooks/useProtectedFeatures";
import { formatViews, formatDate } from "@/lib/utils/dateFormat";
import RelatedVideos from "@/components/RelatedVideos";

export default function VideoPage({ params }) {
  const { isAuthenticated } = useUserStore();
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const {
    handleLike,
    handleWatchLater,
    isLiked,
    isInWatchLater,
    isLoadingLike,
    isLoadingWatchLater,
  } = useProtectedFeatures(id);

  const [updateLike, setUpdateLike] = useState(false);
  const [updateWatchLater, setUpdateWatchLater] = useState(false);

  const [viewDescription, setViewDescription] = useState(false);

  // Quietly update like and watch later button when clicked
  useEffect(() => {
    if (isLiked) {
      setUpdateLike(true);
    } else {
      setUpdateLike(false);
    }
  }, [isLiked]);

  useEffect(() => {
    if (isInWatchLater) {
      setUpdateWatchLater(true);
    } else {
      setUpdateWatchLater(false);
    }
  }, [isInWatchLater]);

  const {
    data: video,
    isLoading: isLoadingVideo,
    isError: isVideoError,
    error: videoError,
  } = useVideoDetails(id);

  useEffect(() => {
    // Scroll to top when video ID changes
    window.scrollTo(0, 0);
  }, [id]);

  if (isVideoError) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-16">
        <AlertTitle>Error Loading Video</AlertTitle>
        <AlertDescription>
          {videoError?.message ||
            "Failed to load video. Please try again later."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <main className="flex min-h-screen flex-col pt-16">
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        <div className="flex-1">
          <VideoPlayer videoId={id} />
          {/* Video Details */}
          <div className="py-4">
            <h1 className="text-2xl font-semibold mb-2">
              {video?.snippet?.title}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {video?.snippet?.channelTitle}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {isAuthenticated && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={isLiked ? "text-customRed" : ""}
                      onClick={() => {
                        setUpdateLike(!updateLike);
                        toast(
                          updateLike
                            ? "Removed from Liked videos"
                            : "Added to Liked videos"
                        );
                        handleLike();
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
                      <span className="ml-2">{updateLike ? "Liked" : "Like"}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={updateWatchLater ? "text-customRed" : ""}
                      onClick={() => {
                        setUpdateWatchLater(!updateWatchLater);
                        toast(
                          updateWatchLater
                            ? "Removed from Watch Later"
                            : "Added to Watch Later"
                        );
                        handleWatchLater();
                      }}
                      disabled={isLoadingWatchLater}
                    >
                      {isLoadingWatchLater ? null : (
                        <Clock className="h-4 w-4" />
                      )}
                      <span className="ml-2">
                        {updateWatchLater ? "In Watch Later" : "Watch Later"}
                      </span>
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                {formatViews(video?.statistics?.viewCount)} views •{" "}
                {formatDate(video?.snippet?.publishedAt)}
              </p>
              <div className="mt-2"></div>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-center"
                onClick={() => setViewDescription(!viewDescription)}
              >
                <div className="flex items-center gap-2">
                  {viewDescription ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span>
                    {viewDescription ? "Description" : "View Description"}
                  </span>
                </div>
              </Button>
              {viewDescription && (
                <div className="mt-2 p-4 bg-secondary rounded-md">
                  <p className="text-sm whitespace-pre-wrap">
                    {video?.snippet?.description || "No description available"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Related Videos */}
      <RelatedVideos currentVideoId={id} videoTitle={video?.snippet?.title} />
    </main>
  );
}
