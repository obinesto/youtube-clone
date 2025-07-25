"use client";
import { useState } from "react";
import { useLikedVideos } from "@/hooks/useQueries";
import VideoCard from "@/components/VideoCard";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import useUserStore from "@/hooks/useStore";
import LoadingProtected from "@/components/LoadingProtected";
import { AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LikedVideosPage() {
  const { isAuthenticated } = useUserStore();
  const { data: videos, isLoading, error } = useLikedVideos();
  const [sortBy, setSortBy] = useState("recent"); // recent, oldest, popular

  if (!isAuthenticated) return null;

  if (isLoading) {
    return <LoadingProtected />;
  }

  if (error) {
    return (
      <div className="p-4 mt-16 md:ml-5">
        <h1 className="text-3xl font-bold mb-6">Liked Videos</h1>
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
                "Error loading liked videos. Please try again later"
              )}
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const validVideos = (videos || []).filter((video) => video?.id);

  const sortedVideos = [...validVideos].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return new Date(b.likedAt) - new Date(a.likedAt);
      case "oldest":
        return new Date(a.likedAt) - new Date(b.likedAt);
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
          Liked Videos
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

      {!videos?.length && !isLoading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">No liked videos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedVideos.map((video) => (
            <VideoCard
              key={video.id}
              videoId={video.id}
              title={video.snippet.title}
              thumbnail={video.snippet.thumbnails.high?.url}
              channelTitle={video.snippet.channelTitle}
              createdAt={video.snippet.publishedAt}
              views={video.statistics.viewCount}
              duration={video.contentDetails.duration}
              likedAt={video.likedAt}
            />
          ))}
        </div>
      )}
    </main>
  );
}
