"use client";
import { useVideos } from "@/hooks/useQueries";
import VideoCard from "@/components/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export default function Home() {
  const { data: videos, isLoading, isError } = useVideos();

  if (isError) {
    return (
      <Alert>
        <AlertDescription className="text-customRed">
          Error loading videos. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)] mb-16">
      <div className="container mx-auto px-4 pt-16">
        <Card className="p-4 border-hidden">
          <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed">
            Latest Videos
          </h1>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 12 }).map((_, index) => (
              <Skeleton key={index} className="h-[300px] w-full rounded-lg" />
            ))
          ) : (
            videos?.map((video) => (
                <VideoCard
                  key={video.id.videoId}
                  id={video.id.videoId}
                  channelTitle={video.snippet.channelTitle}
                  title={video.snippet.title}
                  thumbnail={video.snippet.thumbnails.high.url}
                  createdAt={video.snippet.publishedAt}
                  description={video.snippet.description}
                  views={video.statistics?.viewCount}
                  duration={video.contentDetails?.duration}
                />
            ))
          )}
        </div>
      </div>
    </ScrollArea>
  );
}