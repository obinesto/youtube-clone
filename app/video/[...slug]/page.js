import axios from "axios";
import VideoPageClient from "@/components/video-page-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

// Function to fetch video data on the server
async function getVideoData(videoId) {
  if (!videoId) return null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : "http://localhost:3000";
    const apiUrl = `${baseUrl}/api/youtube/videos`;

    const response = await axios.get(apiUrl, {
      params: {
        part: "snippet,statistics,contentDetails",
        id: videoId,
      },
    });

    if (!response.data?.items?.length) {
      return null;
    }
    return response.data.items[0];
  } catch (error) {
    console.error("Error fetching video data on server:", error);
    return null;
  }
}

// Dynamically generate metadata
export async function generateMetadata({ params: paramsPromise }) {
  const params = await paramsPromise;

  const videoId = params.slug && params.slug.length > 0 ? params.slug[0] : null;
  const channelIdentifier =
    params.slug && params.slug.length > 1 ? params.slug[1] : null;

  if (!videoId) {
    return {
      title: "Video Not Found",
      description: "The requested video could not be found.",
    };
  }

  const videoData = await getVideoData(videoId);

  if (!videoData) {
    return {
      title: "Video Not Found",
      description: "The requested video could not be found.",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000";
  const pageUrl = `${baseUrl}/video/${videoId}/${
    channelIdentifier || videoData.snippet.channelId
  }`;
  const thumbnailUrl =
    videoData.snippet.thumbnails?.maxres?.url ||
    videoData.snippet.thumbnails?.high?.url ||
    videoData.snippet.thumbnails?.default?.url;

  return {
    title: videoData.snippet.title,
    description: videoData.snippet.description.substring(0, 200),
    creator: videoData.snippet.channelTitle || "Cyprian Obi",
    keywords: [
      videoData.snippet.title,
      videoData.snippet.channelTitle,
      "video",
      "watch",
    ],
    url: pageUrl,
    openGraph: {
      type: "video.other",
      title: videoData.snippet.title,
      description: videoData.snippet.description.substring(0, 200),
      url: pageUrl,
      images: thumbnailUrl
        ? [
            {
              url: thumbnailUrl,
              width: 1280,
              height: 720,
              alt: videoData.snippet.title,
            },
          ]
        : [],
      videos: [
        {
          url: pageUrl,
          secure_url: pageUrl,
          type: "text/html",
          width: 1280,
          height: 720,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: videoData.snippet.title,
      description: videoData.snippet.description.substring(0, 200),
      creator: "@Mc_Cprian02",
      images: thumbnailUrl ? [thumbnailUrl] : [],
    },
  };
}

export default async function VideoPage({ params: paramsPromise }) {
  const params = await paramsPromise;

  const videoId = params.slug && params.slug.length > 0 ? params.slug[0] : null;
  const channelId =
    params.slug && params.slug.length > 1 ? params.slug[1] : null;

  if (!videoId || !channelId) {
    return (
      <div className="p-4 mt-16">
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col md:flex-row items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Error loading video from server.</span>
            <span>Please try again later.</span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const videoData = await getVideoData(videoId);

  if (!videoData) {
    return (
      <div className="p-4 mt-16">
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col md:flex-row items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Error loading video from server.</span>
            <span>Please try again later.</span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <VideoPageClient
      videoId={videoId}
      channelId={channelId}
      initialVideoData={videoData}
    />
  );
}
