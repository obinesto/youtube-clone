"use client";
import { useTrendingVideos } from "@/hooks/useQueries";
import VideoCard from "@/components/VideoCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function TrendingPage() {
  const { data: videos, isLoading, error } = useTrendingVideos();

  if (error) {
    return (
      <div className="p-4 mt-16 md:ml-5">
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-center">
              {error?.message && error?.message.includes("quota") ? (
                <>
                  <p>⛔ YouTube API quota exhausted.</p>
                  <p>
                    Kindly come back in the next 24 hours when it will be reset.
                    Thanks for your patience!🙏
                  </p>
                </>
              ) : (
                "Error loading trending videos. Please try again later"
              )}
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 pt-16">
      <Card className="p-4 border-hidden">
        <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed">
          Trending Videos
        </h1>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 12 }).map((_, index) => (
              <Skeleton key={index} className="h-[300px] w-full rounded-lg" />
            ))
          : videos?.map((video) => (
              <VideoCard
                key={video.id}
                videoId={video.id}
                title={video.snippet.title}
                thumbnail={video.snippet.thumbnails.high?.url}
                channelTitle={video.snippet.channelTitle}
                createdAt={video.snippet.publishedAt}
                views={video.statistics.viewCount}
                duration={video.contentDetails.duration}
              />
            ))}
      </div>
    </main>
  );
}
