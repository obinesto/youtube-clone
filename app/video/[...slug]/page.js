import { notFound } from "next/navigation";
import axiosInstance from "@/lib/axios";
import VideoPageClient from "@/components/video-page-client";

// Function to fetch video data on the server
async function getVideoData(videoId) {
  if (!videoId) return null;
  try {
    const response = await axiosInstance.get("/videos", {
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
  const channelIdentifier = params.slug && params.slug.length > 1 ? params.slug[1] : null;

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

  const pageUrl = `https://youtube-clone-cyprianobi.vercel.app/video/${videoId}/${
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
  const channelId = params.slug && params.slug.length > 1 ? params.slug[1] : null;

  if (!videoId || !channelId) {
    notFound();
  }

  const videoData = await getVideoData(videoId);

  if (!videoData) {
    notFound();
  }

  return (
    <VideoPageClient
      videoId={videoId}
      channelId={channelId}
      initialVideoData={videoData}
    />
  );
}
