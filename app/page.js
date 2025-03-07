"use client";
import { useVideos, useVideoDetails } from "@/hooks/useQueries";
import VideoCard from "@/components/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { data: videos, isLoading, isError } = useVideos();
  const videosId = videos?.map((video) => video.id.videoId).join(",");
  const {
    data: videoDetails,
    isLoading: isVideoLoading,
    isError: isVideoError,
  } = useVideoDetails(videosId);

  if (isError || isVideoError) {
    return (
      <Alert>
        <AlertDescription className="text-customRed">
          Error loading videos. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const mergedVideos = videos?.map((video) => {
    const details = videoDetails?.find(detail => detail.id === video.id.videoId);
    return {
      ...video,
      statistics: details?.statistics,
      contentDetails: details?.contentDetails
    };
  });

  return (
    <ScrollArea className="h-[calc(100vh-4rem)] mb-16">
      <div className="container mx-auto px-4 pt-16">
        <Card className="p-4 border-hidden">
          <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed">
            Latest Videos
          </h1>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading || isVideoLoading ? (
            Array.from({ length: 12 }).map((_, index) => (
              <Skeleton key={index} className="h-[300px] w-full rounded-lg" />
            ))
          ) : (
            mergedVideos?.map((video) => (
              <Card key={video.id.videoId} className="overflow-hidden">
                <CardContent className="p-0">
                  <VideoCard
                    id={video.id.videoId}
                    channelTitle={video.snippet.channelTitle}
                    title={video.snippet.title}
                    thumbnail={video.snippet.thumbnails.high.url}
                    createdAt={video.snippet.publishedAt}
                    description={video.snippet.description}
                    views={video.statistics?.viewCount}
                    duration={video.contentDetails?.duration}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </ScrollArea>
  );
}