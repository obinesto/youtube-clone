"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingProtected from "@/components/LoadingProtected";
import { useVideoDetails } from "@/hooks/useQueries";
import VideoCard from "@/components/VideoCard";
import useUserStore from "@/hooks/useStore";

export default function SubscriptionsPage() {
  const { user, isAuthenticated } = useUserStore();
  const [subscriptionVideos, setSubscriptionVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Implement subscription videos fetching
  // This will be implemented when we add subscription functionality

  if (!isAuthenticated) return null;
  if (isLoading) return <LoadingProtected />;

  return (
    <div className="container mx-auto px-4 pt-16">
      <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed">
        Subscriptions
      </h1>
      {subscriptionVideos.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No subscriptions yet</h2>
          <p className="text-muted-foreground">
            Videos from your subscribed channels will appear here
          </p>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {subscriptionVideos.map((video) => (
              <VideoCard key={video.id} {...video} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
