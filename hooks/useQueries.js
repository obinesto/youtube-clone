import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";
import useUserStore from "./useStore";

const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const CACHE_TIME = 1000 * 60 * 30; // 30 minutes

const handleApiError = (error) => {
  if (error.response?.status === 403) {
    throw new Error("YouTube API quota exceeded. Please try again later.");
  }
  if (error.response?.status === 404) {
    throw new Error("Video not found.");
  }
  throw new Error(error.response?.data?.message || "An unexpected error occurred.");
};

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
        });
        
        if (!response.data?.items?.length) {
          throw new Error("No videos found");
        }
        
        return response.data.items;
      } catch (error) {
        return handleApiError(error);
      }
    },
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: (failureCount, error) => {
      return failureCount < 2 && !error.message.includes("quota exceeded");
    },
  });
};

export const useVideoDetails = (videoId) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["video", videoId],
    queryFn: async () => {
      if (!videoId) throw new Error("Video ID is required");
      
      try {
        const response = await axiosInstance.get("/videos", {
          params: {
            part: "snippet,statistics,contentDetails",
            id: videoId,
          },
        });

        if (!response.data?.items?.length) {
          throw new Error("Video not found");
        }

        const items = response.data.items;
        // Cache individual video data for future use
        if (videoId.includes(",")) {
          items.forEach(item => {
            queryClient.setQueryData(
              ["video", item.id],
              item
            );
          });
          return items;
        }
        
        return items[0];
      } catch (error) {
        return handleApiError(error);
      }
    },
    enabled: Boolean(videoId),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: (failureCount, error) => {
      return failureCount < 2 && !error.message.includes("quota exceeded");
    },
  });
};

export const useRelatedVideos = (videoId, videoTitle) => {
  return useQuery({
    queryKey: ["relatedVideos", videoId],
    queryFn: async () => {
      if (!videoTitle) {
        throw new Error("Video title is required to fetch related videos");
      }
      
      try {
        const response = await axiosInstance.get("/search", {
          params: {
            part: "snippet",
            type: "video",
            maxResults: 10,
            q: videoTitle,
          },
        });

        if (!response.data?.items?.length) {
          throw new Error("No related videos found");
        }

        return response.data.items.filter(item => item.id.videoId !== videoId);
      } catch (error) {
        return handleApiError(error);
      }
    },
    enabled: Boolean(videoId && videoTitle),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: (failureCount, error) => {
      return failureCount < 2 && !error.message.includes("quota exceeded");
    },
  });
};

// Watch History
export const useWatchHistory = () => {
  const { isAuthenticated, token } = useUserStore();
  
  return useQuery({
    queryKey: ["watchHistory"],
    queryFn: async () => {
      const response = await fetch("/app/api/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch watch history");
      const data = await response.json();
      return data.history;
    },
    enabled: Boolean(isAuthenticated && token),
  });
};

export const useAddToHistory = () => {
  const queryClient = useQueryClient();
  const { token } = useUserStore();

  return useMutation({
    mutationFn: async (videoId) => {
      const response = await fetch("/app/api/history", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId }),
      });
      if (!response.ok) throw new Error("Failed to add to history");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["watchHistory"]);
    },
  });
};

export const useClearHistory = () => {
  const queryClient = useQueryClient();
  const { token } = useUserStore();

  return useMutation({
    mutationFn: async (videoId) => {
      const response = await fetch("/app/api/history", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId }),
      });
      if (!response.ok) throw new Error("Failed to clear history");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["watchHistory"]);
    },
  });
};

// Likes
export const useLikedVideos = () => {
  const { isAuthenticated, token, user } = useUserStore();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["likedVideos"],
    queryFn: async () => {
      // First get liked videos from our database
      const response = await fetch(`/api/likes?email=${encodeURIComponent(user.email)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch liked videos");
      const data = await response.json();
      
      if (!data.likes?.length) return [];

      // Then get video details from YouTube API
      const videoIds = data.likes.map(like => like.video_id).join(',');
      const { data: videos } = await axiosInstance.get("/videos", {
        params: {
          part: "snippet,statistics,contentDetails",
          id: videoIds,
        },
      });

      // Merge database and YouTube data
      return data.likes.map(like => {
        const videoData = videos.items.find(v => v.id === like.video_id);
        return {
          ...videoData,
          likedAt: like.created_at
        };
      });
    },
    enabled: Boolean(isAuthenticated && token && user?.email),
  });
};

export const useVideoLike = () => {
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  return useMutation({
    mutationFn: async ({ videoId, action }) => {
      if (!user?.email) throw new Error("User email required");
      
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          action,
          email: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update like status');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['likedVideos']);
      queryClient.invalidateQueries(['videoLike']);
    },
    onError: handleApiError,
  });
};

// Watch Later
export const useWatchLater = () => {
  const { isAuthenticated, token, user } = useUserStore();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["watchLater"],
    queryFn: async () => {
      // First get watch later videos from our database
      const response = await fetch(`/api/watch-later?email=${encodeURIComponent(user.email)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch watch later list");
      const data = await response.json();
      
      if (!data.watchLater?.length) return [];

      // Then get video details from YouTube API
      const videoIds = data.watchLater.map(item => item.video_id).join(',');
      const { data: videos } = await axiosInstance.get("/videos", {
        params: {
          part: "snippet,statistics,contentDetails",
          id: videoIds,
        },
      });

      // Merge database and YouTube data
      return data.watchLater.map(item => {
        const videoData = videos.items.find(v => v.id === item.video_id);
        return {
          ...videoData,
          savedAt: item.created_at
        };
      });
    },
    enabled: Boolean(isAuthenticated && token && user?.email),
  });
};

export const useWatchLaterMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  return useMutation({
    mutationFn: async ({ videoId, action }) => {
      if (!user?.email) throw new Error("User email required");
      
      const response = await fetch('/api/watch-later', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          action,
          email: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update watch later status');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['watchLater']);
      queryClient.invalidateQueries(['watchLaterStatus']);
    },
    onError: handleApiError,
  });
};

// User Videos
export const useUserVideos = () => {
  const { isAuthenticated, token } = useUserStore();

  return useQuery({
    queryKey: ["userVideos"],
    queryFn: async () => {
      const response = await fetch("/app/api/videos?userId=me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch user videos");
      const data = await response.json();
      return data.videos;
    },
    enabled: Boolean(isAuthenticated && token),
  });
};

export const useVideoMutation = () => {
  const queryClient = useQueryClient();
  const { token } = useUserStore();

  return useMutation({
    mutationFn: async ({ type, videoId, data }) => {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        method: type === "create" ? "POST" : type === "update" ? "PATCH" : "DELETE",
        body: JSON.stringify(type === "delete" ? { videoId } : { videoId, ...data }),
      };

      const response = await fetch("/app/api/videos", config);
      if (!response.ok) throw new Error(`Failed to ${type} video`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["userVideos"]);
    },
  });
};

export const useTrendingVideos = () => {
  return useQuery({
    queryKey: ["trendingVideos"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/videos", {
          params: {
            part: "snippet,statistics,contentDetails",
            chart: "mostPopular",
            maxResults: 50,
            // regionCode: "US or any other country code",
          },
        });
        
        if (!response.data?.items?.length) {
          throw new Error("No trending videos found");
        }
        
        return response.data.items;
      } catch (error) {
        return handleApiError(error);
      }
    },
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    retry: (failureCount, error) => {
      return failureCount < 2 && !error.message.includes("quota exceeded");
    },
  });
};

