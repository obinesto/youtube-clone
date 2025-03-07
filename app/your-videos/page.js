"use client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import LoadingProtected from "@/components/LoadingProtected";
import VideoCard from "@/components/VideoCard";
import useUserStore from "@/hooks/useStore";
import { useUserVideos } from "@/hooks/useQueries";
import { useRouter } from "next/navigation";

export default function YourVideosPage() {
  const { isAuthenticated } = useUserStore();
  const router = useRouter();
  const { data: userVideos, isLoading } = useUserVideos();

  if (!isAuthenticated) return null;
  if (isLoading) return <LoadingProtected />;

  return (
    <div className="container mx-auto px-4 pt-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed">
          Your Videos
        </h1>
        <Button
          onClick={() => router.push("/studio/upload")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Upload Video
        </Button>
      </div>

      {!userVideos?.length ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No videos uploaded</h2>
          <p className="text-muted-foreground mb-4">
            Share your content with the world
          </p>
          <Button
            onClick={() => router.push("/studio/upload")}
            className="flex items-center gap-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            Upload Your First Video
          </Button>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {userVideos.map((video) => (
              <VideoCard key={video.id} {...video} isOwner={true} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
