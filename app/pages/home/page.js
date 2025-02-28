"use client";
import { useVideos } from "@/hooks/useQueries";
import VideoCard from "@/app/components/VideoCard";
import VideoCardSkeleton from "@/app/components/loaders/SkeletonLoader";

  export default function Home() {
    const { data: videos, isLoading, isError } = useVideos();
  
    if (isError) {
      return <div className="text-customRed">Error loading videos</div>;
    }
  
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-customRed dark:text-customRed">
          Latest Videos
        </h1>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <VideoCardSkeleton key={index} />
              ))
            : videos?.map((video) => (
                <VideoCard
                  key={video.id.videoId}
                  id={video.id.videoId}
                  title={video.snippet.title}
                  thumbnail={video.snippet.thumbnails.high.url}
                  views={video.statistics?.viewCount || 0}
                  createdAt={video.snippet.publishedAt}
                />
              ))}
        </div>
      </div>
    );
  }
