"use client";
import { useRelatedVideos } from "@/hooks/useQueries";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import VideoCard from "./VideoCard";

export default function RelatedVideos({ currentVideoId, videoTitle }) {
  const { data: videos, isLoading, error } = useRelatedVideos(currentVideoId, videoTitle);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(4).fill(null).map((_, index) => (
          <div key={index} className="relative">
            <div className="aspect-video">
              <Skeleton className="absolute inset-0" />
            </div>
            <div className="mt-2 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!videos?.length) {
    return <div className="text-muted-foreground">No related videos found</div>;
  }

  return (
    <div className="container px-4">
      <h2 className="text-xl font-semibold">Related Videos</h2>
      <ScrollArea className="h-[calc(100vh-9rem)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {videos?.map((video) => (
            <VideoCard
              key={video.id.videoId}
              id={video.id.videoId}
              title={video.snippet.title}
              thumbnail={video.snippet.thumbnails.high?.url}
              channelTitle={video.snippet.channelTitle}
              createdAt={video.snippet.publishedAt}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}