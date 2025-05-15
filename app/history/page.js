"use client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import LoadingProtected from "@/components/LoadingProtected";
import VideoCard from "@/components/VideoCard";
import useUserStore from "@/hooks/useStore";
import { useWatchHistory, useClearHistory } from "@/hooks/useQueries";

export default function HistoryPage() {
  const { isAuthenticated } = useUserStore();
  const { data: watchHistory, isLoading } = useWatchHistory();
  const clearHistoryMutation = useClearHistory();
  
  const handleClearHistory = async () => {
    try {
      await clearHistoryMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  if (!isAuthenticated) return null;
  if (isLoading) return <LoadingProtected />;

  return (
    <div className="container mx-auto px-4 pt-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed">Watch History</h1>
        {watchHistory?.length > 0 && (
          <Button 
            variant="destructive" 
            onClick={handleClearHistory}
            disabled={clearHistoryMutation.isLoading}
            className="flex items-center gap-2"
          >
            {clearHistoryMutation.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Clear History
          </Button>
        )}
      </div>

      {!watchHistory?.length ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No watch history</h2>
          <p className="text-muted-foreground">
            Videos you watch will appear here
          </p>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {watchHistory.map((video) => (
              <VideoCard 
              key={video.id}
              videoId={video.id}
              title={video.snippet.title}
              thumbnail={video.snippet.thumbnails.high?.url}
              channelTitle={video.snippet.channelTitle}
              createdAt={video.snippet.publishedAt}
              views={video.statistics.viewCount}
              duration={video.contentDetails.duration}
              watchedAt={video.watchedAt}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}