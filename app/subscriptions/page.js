"use client";

import { useState } from "react";
import {
  useSubscriptions,
  useSubscribeMutation,
  useChannelInfo,
} from "@/hooks/useQueries";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import LoadingProtected from "@/components/LoadingProtected";
import useUserStore from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import VideoCard from "@/components/VideoCard";
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
  const {
    data: channelData,
    isLoading: isLoadingChannelData,
    error: ChannelDataError,
  } = useChannelInfo(subscriptions || []);
  const unsubscribeMutation = useSubscribeMutation();
  const [sortOrders, setSortOrders] = useState({});
  const [showChannelVideos, setShowChannelVideos] = useState({});

  if (!isAuthenticated) return null;

  if (isLoading || isLoadingChannelData) return <LoadingProtected />;

  if (error || ChannelDataError) {
    return (
      <div className="p-4 mt-16 md:ml-5">
        <h1 className="text-3xl font-bold mb-6">Subscriptions</h1>
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
                "Error loading subscribed channels. Please try again later"
              )}
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleUnsubscribe = async (channelId) => {
    try {
      await unsubscribeMutation.mutateAsync({
        channelId,
        action: "remove",
      });
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
    }
  };

  const handleSortChange = (channelId, value) => {
    setSortOrders((prev) => ({
      ...prev,
      [channelId]: value,
    }));
  };

  const toggleChannelVideos = (channelId) => {
    setShowChannelVideos((prev) => ({
      ...prev,
      [channelId]: !prev[channelId],
    }));
  };

  const getSortedVideos = (videos, channelId) => {
    if (!videos) return [];
    const sortOrder = sortOrders[channelId] || "recent";

    return [...videos].sort((a, b) => {
      switch (sortOrder) {
        case "recent":
          return (
            new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt)
          );
        case "oldest":
          return (
            new Date(a.snippet.publishedAt) - new Date(b.snippet.publishedAt)
          );
        case "popular":
          return (
            parseInt(b.statistics.viewCount) - parseInt(a.statistics.viewCount)
          );
        default:
          return 0;
      }
    });
  };

  return (
    <div className="container mx-auto px-4 pt-16 max-w-[2000px]">
      <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed mb-6">
        Subscriptions
      </h1>

      {!subscriptions?.length ? (
        <Card className="p-4 md:p-8 text-center">
          <h2 className="text-lg md:text-xl font-semibold mb-2">
            No subscriptions yet
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Videos from channels you subscribe to will appear here
          </p>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-6 md:space-y-8">
            {channelData.map((channel) => {
              const channelInfo = channel?.channelInfo;
              const videos = channel?.videos;
              const handleChannelVisibility =
                showChannelVideos[channelInfo.channel_id];

              return (
                <div key={channelInfo.channel_id} className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="rounded-full size-8 md:size-10 overflow-hidden flex-shrink-0">
                          <Image
                            src={
                              channelInfo?.snippet?.thumbnails?.default?.url ||
                              "/placeholder.svg"
                            }
                            alt={
                              channelInfo?.snippet?.title || "Channel thumbnail"
                            }
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                        <h2 className="text-base md:text-lg font-semibold truncate">
                          {channelInfo.channel_title}
                        </h2>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => {
                            toggleChannelVideos(channelInfo.channel_id);
                          }}
                        >
                          {handleChannelVisibility ? (
                            <span className="flex items-center gap-2">
                              <ChevronUp className="h-4 w-4" />
                              <span className="hidden sm:inline">
                                Close videos
                              </span>
                              <span className="sm:hidden">Close</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <ChevronDown className="h-4 w-4" />
                              <span className="hidden sm:inline">
                                Open videos
                              </span>
                              <span className="sm:hidden">Open</span>
                            </span>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() =>
                            handleUnsubscribe(channelInfo.channel_id)
                          }
                          disabled={unsubscribeMutation.isLoading}
                        >
                          Unsubscribe
                        </Button>
                      </div>
                    </div>

                    {handleChannelVisibility && (
                      <Select
                        value={sortOrders[channelInfo.channel_id] || "recent"}
                        onValueChange={(value) =>
                          handleSortChange(channelInfo.channel_id, value)
                        }
                      >
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Sort videos..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recent">Most Recent</SelectItem>
                          <SelectItem value="oldest">Oldest</SelectItem>
                          <SelectItem value="popular">Most Popular</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {handleChannelVisibility && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      {getSortedVideos(videos, channelInfo.channel_id).map(
                        (video) => (
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
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
