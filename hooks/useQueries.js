import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";
import useUserStore from "./useStore";
import * as Sentry from "@sentry/react";

const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const CACHE_TIME = 1000 * 60 * 30; // 30 minutes

const handleApiError = (error) => {
  Sentry.captureException(error);
  if (error.response?.status === 403) {
    throw new Error("YouTube API quota exceeded. Please try again later.");
  }
  if (error.response?.status === 404) {
    throw new Error("Video not found.");
  }
  throw new Error(
    error.response?.data?.message || "An unexpected error occurred."
  );
};

export const useVideos = () => {
  return useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      try {
        Sentry.addBreadcrumb({
          category: "videos",
          message: "Fetching videos",
          level: "info",
        });
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
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      return failureCount < 2 && !error.message.includes("quota exceeded");
    },
  });
};

export const useSearchVideos = (query) => {
  return useQuery({
    queryKey: ["searchVideos", query],
    queryFn: async () => {
      if (!query) throw new Error("Query is required");

      try {
        Sentry.addBreadcrumb({
          category: "search",
          message: "Searching videos",
          level: "info",
        });
        const response = await axiosInstance.get("/search", {
          params: {
            part: "snippet",
            type: "video",
            maxResults: 50,
            q: query,
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
    enabled: Boolean(query),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,

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
        Sentry.addBreadcrumb({
          category: "video",
          message: "Fetching video details",
          level: "info",
        });
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
          items.forEach((item) => {
            queryClient.setQueryData(["video", item.id], item);
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
        Sentry.addBreadcrumb({
          category: "related-videos",
          message: "Fetching related videos",
          level: "info",
        });
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

        return response.data.items.filter(
          (item) => item.id.videoId !== videoId
        );
      } catch (error) {
        return handleApiError(error);
      }
    },
    enabled: Boolean(videoId && videoTitle),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      return failureCount < 2 && !error.message.includes("quota exceeded");
    },
  });
};

// Watch History
export const useWatchHistory = () => {
  const { isAuthenticated, token, user } = useUserStore();

  return useQuery({
    queryKey: ["watchHistory"],
    queryFn: async () => {
      try {
        Sentry.addBreadcrumb({
          category: "watch-history",
          message: "Fetching watch history",
          level: "info",
        });
        const response = await fetch(
          `/api/history?email=${encodeURIComponent(user.email)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          console.error("API error response:", errorData);
          throw new Error(
            `Failed to fetch watch history (Status: ${response.status})`
          );
        }
        const data = await response.json();

        // Separate YouTube videos from user-uploaded videos
        const youtubeVideos = data.watchHistory.filter(
          (history) => !history.is_user_video
        );
        const userVideos = data.watchHistory.filter(
          (history) => history.is_user_video
        );

        // Get YouTube video details
        let youtubeVideoDetails = [];
        if (youtubeVideos.length) {
          const videoIds = youtubeVideos
            .map((video) => video.video_id)
            .join(",");
          const { data: videos } = await axiosInstance.get("/videos", {
            params: {
              part: "snippet,statistics,contentDetails",
              id: videoIds,
            },
          });
          youtubeVideoDetails = youtubeVideos.map((video) => {
            const videoData = videos.items.find((v) => v.id === video.video_id);
            return {
              ...videoData,
              watchedAt: video.created_at,
            };
          });
        }

        // Get user-uploaded video details
        let userVideoDetails = [];
        if (userVideos.length) {
          const userVideoIds = userVideos
            .map((video) => video.video_id)
            .join(",");
          const userVideoResponse = await fetch(
            `/api/videos?ids=${userVideoIds}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (!userVideoResponse.ok)
            throw new Error("Failed to fetch user videos");
          const userData = await userVideoResponse.json();
          userVideoDetails = userVideos.map((video) => {
            const videoData = userData.videos.find(
              (v) => v.id === video.video_id
            );
            return {
              ...videoData,
              watchedAt: video.created_at,
            };
          });
        }

        // Combine and sort all videos
        const combinedVideos = [
          ...youtubeVideoDetails,
          ...userVideoDetails,
        ].sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));

        return combinedVideos;
      } catch (error) {
        Sentry.captureException(error);
        console.error("Failed to fetch watch history", error);
        throw error;
      }
    },
    enabled: Boolean(isAuthenticated && token),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useAddToHistory = () => {
  const queryClient = useQueryClient();
  const { token, user } = useUserStore();

  return useMutation({
    mutationFn: async ({ videoId }) => {
      try {
        Sentry.addBreadcrumb({
          category: "history",
          message: "Adding to watch history",
          level: "info",
        });
        const response = await fetch(`/api/history`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoId,
            email: user.email,
            action: "add",
          }),
        });
        if (!response.ok) throw new Error("Failed to add to history");
        return response.json();
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["watchHistory"]);
    },
  });
};

export const useClearHistory = () => {
  const queryClient = useQueryClient();
  const { token, user } = useUserStore();

  return useMutation({
    mutationFn: async () => {
      try {
        Sentry.addBreadcrumb({
          category: "history",
          message: "Clearing watch history",
          level: "info",
        });
        const response = await fetch(
          `/api/history?email=${encodeURIComponent(user.email)}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user.email,
            }),
          }
        );
        if (!response.ok) throw new Error("Failed to clear history");
        return response.json();
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["watchHistory"]);
    },
  });
};

// Likes
export const useLikedVideos = () => {
  const { isAuthenticated, token, user } = useUserStore();

  return useQuery({
    queryKey: ["likedVideos"],
    queryFn: async () => {
      try {
        Sentry.addBreadcrumb({
          category: "likes",
          message: "Fetching liked videos",
          level: "info",
        });
        // First get liked videos from our database
        const response = await fetch(
          `/api/likes?email=${encodeURIComponent(user.email)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch liked videos");
        const data = await response.json();

        if (!data.likes?.length) return [];

        // Separate YouTube videos from user-uploaded videos
        const youtubeVideos = data.likes.filter(
          (video) => !video.is_user_video
        );
        const userVideos = data.likes.filter((video) => video.is_user_video);

        // Get YouTube video details
        let youtubeVideoDetails = [];
        if (youtubeVideos.length) {
          const videoIds = youtubeVideos
            .map((video) => video.video_id)
            .join(",");
          const { data: videos } = await axiosInstance.get("/videos", {
            params: {
              part: "snippet,statistics,contentDetails",
              id: videoIds,
            },
          });
          youtubeVideoDetails = youtubeVideos.map((video) => {
            const videoData = videos.items.find((v) => v.id === video.video_id);
            return {
              ...videoData,
              likedAt: video.created_at,
            };
          });
        }

        // Get user-uploaded video details
        let userVideoDetails = [];
        if (userVideos.length) {
          const userVideoIds = userVideos
            .map((video) => video.video_id)
            .join(",");
          const userVideoResponse = await fetch(
            `/api/videos?ids=${userVideoIds}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (!userVideoResponse.ok)
            throw new Error("Failed to fetch user videos");
          const userData = await userVideoResponse.json();
          userVideoDetails = userVideos.map((video) => {
            const videoData = userData.videos.find(
              (v) => v.id === video.video_id
            );
            return {
              ...videoData,
              likedAt: video.created_at,
            };
          });
        }

        // Combine and sort all videos
        const combinedVideos = [
          ...youtubeVideoDetails,
          ...userVideoDetails,
        ].sort((a, b) => new Date(b.likedAt) - new Date(a.likedAt));

        return combinedVideos;
      } catch (error) {
        return handleApiError(error);
      }
    },
    enabled: Boolean(isAuthenticated && token && user?.email),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useVideoLikeMutation = () => {
  const queryClient = useQueryClient();
  const { user, token } = useUserStore();
  return useMutation({
    mutationFn: async ({ videoId, action }) => {
      try {
        if (!user?.email) {
          throw new Error("User email required");
        }
        Sentry.addBreadcrumb({
          category: "likes",
          message: `${action} video like`,
          level: "info",
        });

        const response = await fetch("/api/likes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            videoId,
            action,
            email: user.email,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update like status");
        }

        return response.json();
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["likedVideos"]);
      queryClient.invalidateQueries(["videoLike"]);
    },
    onError: handleApiError,
  });
};

export const useIsVideoLiked = (videoId) => {
  const { isAuthenticated, token, user } = useUserStore();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["videoLikeStatus", videoId],
    queryFn: async () => {
      try {
        // First check if we have the data in the likedVideos query cache
        const likedVideosCache = queryClient.getQueryData(["likedVideos"]);
        if (likedVideosCache) {
          const isLiked = likedVideosCache.some(
            (video) => video.id === videoId
          );
          return isLiked;
        }

        // If no cache, then fetch from API
        Sentry.addBreadcrumb({
          category: "likedVideo",
          message: "Fetching liked video",
          level: "info",
        });

        const response = await fetch(
          `/api/likes?videoId=${videoId}&email=${encodeURIComponent(
            user.email
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          console.error(
            `Failed to fetch like status for video ${videoId}: ${response.statusText}`
          );
          throw new Error(
            `Failed to fetch like status: ${response.statusText}`
          );
        }
        const data = await response.json();
        return data.isLiked ?? false;
      } catch (error) {
        Sentry.captureException(error);
        console.error("Failed to fetch like status", error);
        throw error;
      }
    },
    enabled: Boolean(isAuthenticated && token && user?.email && videoId),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

// Saved Videos
export const useSavedVideos = () => {
  const { isAuthenticated, token, user } = useUserStore();

  return useQuery({
    queryKey: ["savedVideos"],
    queryFn: async () => {
      try {
        Sentry.addBreadcrumb({
          category: "saved-videos",
          message: "Fetching saved videos",
          level: "info",
        });
        // First get saved videos from database
        const response = await fetch(
          `/api/saved-videos?email=${encodeURIComponent(user.email)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch saved videos list");
        const data = await response.json();

        if (!data.savedVideos?.length) return [];

        // Separate YouTube videos from user-uploaded videos
        const youtubeVideos = data.savedVideos.filter(
          (item) => !item.is_user_video
        );
        const userVideos = data.savedVideos.filter(
          (item) => item.is_user_video
        );

        // Get YouTube video details
        let youtubeVideoDetails = [];
        if (youtubeVideos.length) {
          const videoIds = youtubeVideos.map((item) => item.video_id).join(",");
          const { data: videos } = await axiosInstance.get("/videos", {
            params: {
              part: "snippet,statistics,contentDetails",
              id: videoIds,
            },
          });
          youtubeVideoDetails = youtubeVideos.map((item) => {
            const videoData = videos.items.find((v) => v.id === item.video_id);
            return {
              ...videoData,
              savedAt: item.created_at,
            };
          });
        }

        // Get user-uploaded video details
        let userVideoDetails = [];
        if (userVideos.length) {
          const userVideoIds = userVideos
            .map((item) => item.video_id)
            .join(",");
          const userVideoResponse = await fetch(
            `/api/videos?ids=${userVideoIds}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (!userVideoResponse.ok)
            throw new Error("Failed to fetch user videos");
          const userData = await userVideoResponse.json();
          userVideoDetails = userVideos.map((item) => {
            const videoData = userData.videos.find(
              (v) => v.id === item.video_id
            );
            return {
              ...videoData,
              savedAt: item.created_at,
            };
          });
        }

        // Combine and sort all videos
        return [...youtubeVideoDetails, ...userVideoDetails].sort(
          (a, b) => new Date(b.savedAt) - new Date(a.savedAt)
        );
      } catch (error) {
        return handleApiError(error);
      }
    },
    enabled: Boolean(isAuthenticated && token && user?.email),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useSavedVideoMutation = () => {
  const queryClient = useQueryClient();
  const { user, token } = useUserStore();

  return useMutation({
    mutationFn: async ({ videoId, action }) => {
      try {
        if (!user?.email) {
          throw new Error("User email required");
        }

        Sentry.addBreadcrumb({
          category: "saved-videos",
          message: `${action} saved video`,
          level: "info",
        });

        const response = await fetch("/api/saved-videos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            videoId,
            action,
            email: user.email,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update saved video status");
        }

        return response.json();
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["savedVideos"]);
      queryClient.invalidateQueries(["savedVideoStatus"]);
    },
    onError: handleApiError,
  });
};

export const useIsInSavedVideos = (videoId) => {
  const { isAuthenticated, token, user } = useUserStore();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["savedVideoStatus", videoId],
    queryFn: async () => {
      try {
        // First check if we have the data in the saved videos query cache
        const savedVideosCache = queryClient.getQueryData(["savedVideos"]);

        if (savedVideosCache) {
          const isInSavedVideos = savedVideosCache.some(
            (video) => video.id === videoId
          );
          return isInSavedVideos;
        }

        // If no cache, then fetch from API
        Sentry.addBreadcrumb({
          category: "watch-later",
          message: "Fetching watch later status",
          level: "info",
        });

        const response = await fetch(
          `/api/saved-videos?videoId=${videoId}&email=${encodeURIComponent(
            user.email
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch saved video status");
        const data = await response.json();
        return data.isInWatchLater ?? false;
      } catch (error) {
        Sentry.captureException(error);
        console.error("Failed to fetch saved video status", error);
        throw error;
      }
    },
    enabled: Boolean(isAuthenticated && token && user?.email && videoId),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

// User Videos
export const useUserVideos = () => {
  const { isAuthenticated, token, user } = useUserStore();

  return useQuery({
    queryKey: ["userVideos"],
    queryFn: async () => {
      try {
        Sentry.addBreadcrumb({
          category: "user-videos",
          message: "Fetching user videos",
          level: "info",
        });
        const response = await fetch(
          `/api/videos?email=${encodeURIComponent(user.email)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch user videos");
        const data = await response.json();
        return data.videos || [];
      } catch (error) {
        return handleApiError(error);
      }
    },
    enabled: Boolean(isAuthenticated && token),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useVideoMutation = () => {
  const queryClient = useQueryClient();
  const { token } = useUserStore();

  return useMutation({
    mutationFn: async ({ type, videoId, data }) => {
      try {
        Sentry.addBreadcrumb({
          category: "user-videos",
          message: `${type} video operation`,
          level: "info",
        });
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          method:
            type === "create" ? "POST" : type === "update" ? "PATCH" : "DELETE",
          body: JSON.stringify(
            type === "delete" ? { videoId } : { videoId, ...data }
          ),
        };

        const response = await fetch(
          `/api/users?email=${encodeURIComponent(user.email)}`,
          config
        );
        if (!response.ok) throw new Error(`Failed to ${type} video`);
        return response.json();
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
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
        Sentry.addBreadcrumb({
          category: "trending",
          message: "Fetching trending videos",
          level: "info",
        });
        const response = await axiosInstance.get("/videos", {
          params: {
            part: "snippet,statistics,contentDetails",
            chart: "mostPopular",
            maxResults: 50,
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
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      return failureCount < 2 && !error.message.includes("quota exceeded");
    },
  });
};
