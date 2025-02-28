import { useQuery } from "@tanstack/react-query"
import axiosInstance from "../lib/axios"

export const useVideos = () => {
  return useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/search", {
          params: {
            part: "snippet",
            type: "video",
            maxResults: 50,
            order: "date",
          },
        })
        return response.data.items
      } catch (error) {
        console.error("Error fetching videos:", error.response?.data || error.message)
        throw error
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useVideoDetails = (videoId) => {
  return useQuery({
    queryKey: ["video", videoId],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/videos", {
          params: {
            part: "snippet,statistics",
            id: videoId,
          },
        })
        return response.data.items[0]
      } catch (error) {
        console.error("Error fetching video details:", error.response?.data || error.message)
        throw error
      }
    },
    enabled: !!videoId,
  })
}

export const useRelatedVideos = (videoId, videoTitle) => {
  return useQuery({
    queryKey: ["relatedVideos", videoId],
    queryFn: async () => {
      if (!videoTitle) {
        throw new Error("Video title is required to fetch related videos")
      }
      try {
        const response = await axiosInstance.get("/search", {
          params: {
            part: "snippet",
            type: "video",
            maxResults: 10,
            q: videoTitle,
          },
        })
        return response.data.items.filter((item) => item.id.videoId !== videoId)
      } catch (error) {
        console.error("Error fetching related videos:", error.response?.data || error.message)
        throw error
      }
    },
    enabled: !!videoId && !!videoTitle,
  })
}

