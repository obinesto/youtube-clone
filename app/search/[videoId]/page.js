"use client";
import { use } from "react";
import { useEffect } from "react";
import VideoCard from "@/components/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useVideoDetails } from "@/hooks/useQueries";
import { useRelatedVideos } from "@/hooks/useQueries";

function SearchPage({ params }) {
  const { videoId } = use(params);

  // Scroll to top when video ID changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [videoId]);

  // Fetch video details and related videos
  const { data: video, isLoading, error } = useVideoDetails(videoId);
  const videoTitle = video?.snippet.title;
  const currentVideoId = video?.id.videoId || videoId;
  const { data: videos, isLoading: isLoadingRelated } = useRelatedVideos(
    currentVideoId,
    videoTitle,
    50
  );

  // combine both video and related videos into one array
  const combinedVideos = videos?.map((video) => ({
    ...video,
    isRelated: true,
  }));

  if (error) {
    return (
      <div className="p-4 mt-16">
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Error loading search results. Please try again later.</span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 pt-16">
      <Card className="p-4 border-hidden">
        <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed">
          Search Results for:{" "}
          <span className="text-customDark dark:text-customWhite font-medium sm:font-bold text-lg sm:text-xl">{videoTitle || "query"}</span>
        </h1>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading || isLoadingRelated
          ? Array.from({ length: 12 }).map((_, index) => (
              <Skeleton key={index} className="h-[300px] w-full rounded-lg" />
            ))
          : combinedVideos?.map((video) => (
              <VideoCard
                key={video.id.videoId}
                videoId={video.id.videoId}
                channelTitle={video.snippet.channelTitle}
                title={video.snippet.title}
                thumbnail={video.snippet.thumbnails.high.url}
                createdAt={video.snippet.publishedAt}
                views={video.statistics?.viewCount}
                duration={video.contentDetails?.duration}
              />
            ))}
      </div>
    </main>
  );
}
export default SearchPage;
