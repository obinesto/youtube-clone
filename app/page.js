"use client";
import { useFeed } from "@/hooks/useQueries";
import VideoCard from "@/components/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Home() {
  const { data: videos, isLoading, isError, error } = useFeed();

  if (isError) {
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
                "Error loading feed videos. Please try again later"
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
          Feed
        </h1>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 12 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                {/* Thumbnail Skeleton */}
                <div className="relative aspect-video">
                  <Skeleton className="absolute inset-0" />
                </div>
                {/* Content Skeleton */}
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/4" />
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-3 w-10 rounded-full" />
                    <Skeleton className="h-3 w-10 rounded-full" />
                    <Skeleton className="h-3 w-10 rounded-full" />
                  </div>
                </div>
              </Card>
            ))
          : videos?.map((video) => (
              <VideoCard
                key={video.id}
                videoId={video.id}
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
