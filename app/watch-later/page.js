"use client";
import { useState } from "react";
import { useWatchLater } from "@/hooks/useQueries";
import VideoCard from "@/components/VideoCard";
import useUserStore from "@/hooks/useStore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LoadingProtected from "@/components/LoadingProtected";
import { AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WatchLaterPage() {
  const { isAuthenticated } = useUserStore();
  const { data: videos, isLoading, error } = useWatchLater();
  const [sortBy, setSortBy] = useState("recent"); // recent, oldest, popular

  if (!isAuthenticated) return null;

  if (isLoading) {
    return <LoadingProtected />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Watch Later</h1>
        <Alert variant="destructive">
          <AlertDescription className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const sortedVideos = [...(videos || [])].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return new Date(b.savedAt) - new Date(a.savedAt);
      case "oldest":
        return new Date(a.savedAt) - new Date(b.savedAt);
      case "popular":
        return (
          parseInt(b.statistics.viewCount) - parseInt(a.statistics.viewCount)
        );
      default:
        return 0;
    }
  });

  return (
    <main className="container mx-auto px-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed">
          Watch Later
        </h1>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!videos?.length ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">No videos in watch later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedVideos.map((video) => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.snippet.title}
              thumbnail={video.snippet.thumbnails.high?.url}
              channelTitle={video.snippet.channelTitle}
              createdAt={video.snippet.publishedAt}
              views={video.statistics.viewCount}
              duration={video.contentDetails.duration}
              savedAt={video.savedAt}
            />
          ))}
        </div>
      )}
    </main>
  );
}
