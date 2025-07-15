"use client";
import { useState } from "react";
import { useSubscriptions, useSubscribeMutation } from "@/hooks/useQueries";
import VideoCard from "@/components/VideoCard";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingProtected from "@/components/LoadingProtected";
import useUserStore from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SubscriptionsPage() {
  const { isAuthenticated } = useUserStore();
  const { data: subscriptions, isLoading, error } = useSubscriptions();
  const unsubscribeMutation = useSubscribeMutation();
  const [sortOrders, setSortOrders] = useState({});

  if (!isAuthenticated) return null;
  if (isLoading) return <LoadingProtected />;

  if (error) {
    return (
      <div className="flex flex-col pt-16">
        <h1 className="text-3xl font-bold mb-6">Subscriptions</h1>
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTitle className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Something went wrong!
          </AlertTitle>
          <AlertDescription className="mt-2 text-center">
            {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleUnsubscribe = async (channelId) => {
    try {
      await unsubscribeMutation.mutateAsync({
        channelId,
        action: "remove"
      });
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
    }
  };

  const handleSortChange = (channelId, value) => {
    setSortOrders(prev => ({
      ...prev,
      [channelId]: value
    }));
  };

  const getSortedVideos = (videos, channelId) => {
    if (!videos) return [];
    const sortOrder = sortOrders[channelId] || "recent";
    
    return [...videos].sort((a, b) => {
      switch (sortOrder) {
        case "recent":
          return new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt);
        case "oldest":
          return new Date(a.snippet.publishedAt) - new Date(b.snippet.publishedAt);
        case "popular":
          return parseInt(b.statistics.viewCount) - parseInt(a.statistics.viewCount);
        default:
          return 0;
      }
    });
  };

  return (
    <div className="container mx-auto px-4 pt-16">
      <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed mb-6">
        Subscriptions
      </h1>

      {!subscriptions?.length ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No subscriptions yet</h2>
          <p className="text-muted-foreground">
            Videos from channels you subscribe to will appear here
          </p>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-8">
            {subscriptions.map((subscription) => (
              <div key={subscription.channel_id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">
                      {subscription.channel_title}
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnsubscribe(subscription.channel_id)}
                      disabled={unsubscribeMutation.isLoading}
                    >
                      Unsubscribe
                    </Button>
                  </div>
                  <Select
                    value={sortOrders[subscription.channel_id] || "recent"}
                    onValueChange={(value) => handleSortChange(subscription.channel_id, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort videos..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getSortedVideos(subscription.videos, subscription.channel_id).map((video) => (
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
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}