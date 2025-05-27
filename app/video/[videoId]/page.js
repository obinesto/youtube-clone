"use client";
import { useVideoDetails } from "@/hooks/useQueries";
import VideoPlayer from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { use } from "react";
import useUserStore from "@/hooks/useStore";
import { ThumbsUp, Bookmark, Share2, ChevronUp, ChevronDown } from "lucide-react";
import { useProtectedFeatures } from "@/hooks/useProtectedFeatures";
import { formatViews, formatDate } from "@/lib/utils/dateFormat";
import RelatedVideos from "@/components/RelatedVideos";

export default function VideoPage({ params }) {
  const { isAuthenticated } = useUserStore();
  const resolvedParams = use(params);
  const { videoId } = resolvedParams;
  const {
    isLiked,
    isSaved,
    handleLike,
    handleSavedVideo,
    isLoadingLike,
    isLoadingSavedVideo,
  } = useProtectedFeatures(videoId);

  const [updateLike, setUpdateLike] = useState(false);
   const [updateSavedVideo, setUpdateSavedVideo] = useState(false);

  const [viewDescription, setViewDescription] = useState(false);

  // Quietly update like and saved video button after clicking
  useEffect(() => {
    setUpdateLike(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setUpdateSavedVideo(isSaved);
  }, [isSaved]);

  const {
    data: video,
    isError: isVideoError,
    error: videoError,
  } = useVideoDetails(videoId);

  useEffect(() => {
    // Scroll to top when video ID changes
    window.scrollTo(0, 0);
  }, [videoId]);

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
          <VideoPlayer videoId={videoId} />
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
                      className={updateLike ? "text-customRed" : ""}
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
                      <span className="ml-2">
                        {updateLike ? "Liked" : "Like"}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={updateSavedVideo ? "text-customRed" : ""}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setUpdateSavedVideo(prev => !prev);
                        try {
                          await handleSavedVideo();
                        } catch (error) {
                          toast(error.message);
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
                      <span className="ml-2">
                        {updateSavedVideo ? "Saved" : "Save Video"}
                      </span>
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
                      `${window.location.origin}/video/${videoId}`
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
      <RelatedVideos currentVideoId={videoId} videoTitle={video?.snippet?.title} />
    </main>
  );
}
