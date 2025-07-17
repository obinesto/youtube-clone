import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
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

// Fisher-Yates shuffle
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const fetchVideoDetailsInChunks = async (videoIds) => {
  const CHUNK_SIZE = 50; // YouTube API limit for IDs per request
  const allVideoDetails = [];
  for (let i = 0; i < videoIds.length; i += CHUNK_SIZE) {
    const chunk = videoIds.slice(i, i + CHUNK_SIZE);
    if (chunk.length > 0) {
      try {
        const response = await axios.get("/api/youtube/videos", {
          params: {
            part: "snippet,statistics,contentDetails",
            id: chunk.join(","),
          },
        });
        if (response.data?.items) {
          allVideoDetails.push(...response.data.items);
        }
      } catch (error) {
        console.error(`Failed to fetch a chunk of video details:`, error);
      }
    }
  }
  return allVideoDetails;
};

const fetchGuestFeed = async () => {
  try {
    Sentry.addBreadcrumb({
      category: "feed",
      message: "Fetching popular feed for guest/fallback",
      level: "info",
    });
    const response = await axios.get("/api/youtube/videos", {
      params: {
        part: "snippet,statistics,contentDetails",
        chart: "mostPopular",
        maxResults: 50,
      },
    });

    if (!response.data?.items?.length) {
      throw new Error("No popular videos found.");
    }
    return response.data.items;
  } catch (error) {
    throw error;
  }
};

export const useFeed = () => {
  const { isAuthenticated, token, user } = useUserStore();

  return useQuery({
    queryKey: ["feed", { isAuthenticated }],
    queryFn: async () => {
      try {
        if (isAuthenticated && user?.email && token) {
          // Fetch user's watch history and likes
          const [historyResponse, likesResponse] = await Promise.all([
            fetch(`/api/history?email=${encodeURIComponent(user.email)}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }).catch(() => null), // Prevent Promise.all from rejecting if one fails
            fetch(`/api/likes?email=${encodeURIComponent(user.email)}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }).catch(() => null),
          ]);

          const historyData = historyResponse?.ok
            ? await historyResponse.json()
            : null;
          const likesData = likesResponse?.ok
            ? await likesResponse.json()
            : null;

          // Combine, sort and get seed videoIds whose titles are going to be passed as query to search endpoint
          const combinedInteractions = [
            ...(historyData?.watchHistory || []),
            ...(likesData?.likes || []),
          ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          // remove any duplicate videoIds, truncate and then join them
          if (combinedInteractions.length) {
            const seedVideoIds = [...new Set(combinedInteractions)];
            let newSeedVideoIds = seedVideoIds.slice(0, 10);
            newSeedVideoIds = newSeedVideoIds
              .map((item) => item.video_id)
              .join(",");
            const { data: videos } = await axios.get("/api/youtube/videos", {
              params: {
                part: "snippet",
                id: newSeedVideoIds,
              },
            });

            // Get video titles to use as search seeds
            const seedVideos = videos.items;

            if (seedVideos.length) {
              Sentry.addBreadcrumb({
                category: "feed",
                message:
                  "Fetching personalized feed based on recent interactions",
                level: "info",
              });

              // Search for each seed video's related content
              const searchPromises = seedVideos.map(
                (video) =>
                  axios
                    .get("/api/youtube/search", {
                      params: {
                        part: "snippet",
                        type: "video",
                        q: video.snippet.title,
                        maxResults: 50,
                        order: "date",
                        videoCategoryId: video.snippet.categoryId,
                        relevanceLanguage: "en",
                        safeSearch: "moderate",
                        videoEmbeddable: true,
                      },
                    })
                    .catch(() => ({ data: { items: [] } })) // Handle individual search failures gracefully
              );

              const searchResults = await Promise.all(searchPromises);

              // Combine all results and remove duplicates
              const allSearchItems = searchResults.flatMap(
                (result) => result.data.items || []
              );
              const uniqueVideoIds = [
                ...new Set(allSearchItems.map((item) => item.id.videoId)),
              ];

              if (uniqueVideoIds.length > 0) {
                Sentry.addBreadcrumb({
                  category: "videos",
                  message: "Fetching detailed video information",
                  level: "info",
                });

                const detailsItems = await fetchVideoDetailsInChunks(
                  uniqueVideoIds
                );
                // combine feed source for a more unique feed page
                let combinedFeed = [
                  ...(await fetchGuestFeed()),
                  ...detailsItems,
                ];

                // remove duplicate videos
                const uniqueFeed = [
                  ...new Map(
                    combinedFeed.map((video) => [video.id, video])
                  ).values(),
                ];

                const randomizedFeed = shuffleArray(uniqueFeed);
                return randomizedFeed.splice(0, 50);
              }
            }
          }
        }
        // Guest user logic (or fallback for authenticated users)
        return await fetchGuestFeed();
      } catch (error) {
        handleApiError(error);
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
      if (!query) return [];

      try {
        Sentry.addBreadcrumb({
          category: "search",
          message: "Searching videos, channels and playlists",
          level: "info",
        });

        // Search direct videos
        const videoSearchResponse = await axios.get("/api/youtube/search", {
          params: {
            part: "snippet",
            type: "video",
            relevanceLanguage: "en",
            safeSearch: "moderate",
            maxResults: 20,
            order: "date",
            videoEmbeddable: true,
            videoSyndicated: true,
            q: query,
          },
        });

        // Search channels
        const channelSearchResponse = await axios.get("/api/youtube/search", {
          params: {
            part: "snippet",
            type: "channel",
            relevanceLanguage: "en",
            safeSearch: "moderate",
            maxResults: 20,
            order: "date",
            q: query,
          },
        });

        // Search playlists
        const playlistSearchResponse = await axios.get("/api/youtube/search", {
          params: {
            part: "snippet",
            type: "playlist",
            relevanceLanguage: "en",
            safeSearch: "moderate",
            maxResults: 10,
            order: "date",
            q: query,
          },
        });

        // Get videos from matching channels
        const channelVideos = await Promise.all(
          (channelSearchResponse.data?.items || []).map(async (channel) => {
            const channelId = channel.id.channelId;
            const res = await axios.get("/api/youtube/search", {
              params: {
                part: "snippet",
                channelId,
                type: "video",
                maxResults: 5,
                order: "date",
                q: query,
              },
            });
            return res.data.items || [];
          })
        );

        // Get videos from matching playlists
        const playlistVideos = await Promise.all(
          (playlistSearchResponse.data?.items || []).map(async (playlist) => {
            const playlistId = playlist.id.playlistId;
            const res = await axios.get("/api/youtube/playlistItems", {
              params: {
                part: "snippet",
                playlistId,
                maxResults: 5,
              },
            });
            return res.data.items || [];
          })
        );

        // Combine all video items and remove duplicates
        const allVideoItems = [
          ...(videoSearchResponse.data?.items || []),
          ...channelVideos.flat(),
          ...playlistVideos.flat(),
        ];

        const validVideoItems = allVideoItems.filter(
          (item) => item.id?.videoId
        );
        const uniqueVideoIds = [
          ...new Set(validVideoItems.map((item) => item.id.videoId)),
        ];

        Sentry.addBreadcrumb({
          category: "search",
          message: "Fetching video details",
          level: "info",
        });

        if (uniqueVideoIds.length === 0) {
          return [];
        }
        const videoDetails = await fetchVideoDetailsInChunks(uniqueVideoIds);
        return videoDetails;
      } catch (error) {
        handleApiError(error);
        return [];
      }
    },
    enabled: Boolean(query),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) =>
      failureCount < 2 && !error.message.includes("quota exceeded"),
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
        const response = await axios.get("/api/youtube/videos", {
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
        handleApiError(error);
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
        const response = await axios.get("/api/youtube/search", {
          params: {
            part: "snippet",
            type: "video",
            safeSearch: "moderate",
            videoEmbeddable: true,
            videoSyndicated: true,
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
        handleApiError(error);
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
          const { data: videos } = await axios.get("/api/youtube/videos", {
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
          category: "liked-videos",
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
          const { data: videos } = await axios.get("/api/youtube/videos", {
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
        handleApiError(error);
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["likedVideos"] });
      queryClient.invalidateQueries({
        queryKey: ["videoLikeStatus", variables.videoId],
      });
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
          const { data: videos } = await axios.get("/api/youtube/videos", {
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
        handleApiError(error);
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["savedVideos"] });
      queryClient.invalidateQueries({
        queryKey: ["savedVideoStatus", variables.videoId],
      });
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
          category: "saved-video",
          message: "Fetching saved video status",
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
        return data.isInSavedVideos ?? false;
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
        handleApiError(error);
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
        const regions = ["NG", "US", "GB", "IN", "BR", "DE", "AU", "JP"];
        const responses = await Promise.all(
          regions.map((region) =>
            axios.get("/api/youtube/videos", {
              params: {
                part: "snippet,statistics,contentDetails",
                chart: "mostPopular",
                regionCode: region,
                maxResults: 10,
              },
            })
          )
        );

        const combinedResponse = responses.flatMap(
          (response) => response.data.items || []
        );

        if (!combinedResponse.length) {
          throw new Error("No trending videos found");
        }

        const uniqueVideos = [
          ...new Map(
            combinedResponse.map((video) => [video.id, video])
          ).values(),
        ];

        //shuffling to avoid regional bias
        const shuffledVideos = shuffleArray(uniqueVideos);
        return shuffledVideos;
      } catch (error) {
        handleApiError(error);
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

// subscriptions
export const useSubscriptions = () => {
  const { isAuthenticated, token, user } = useUserStore();

  return useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      try {
        Sentry.addBreadcrumb({
          category: "subscriptions",
          message: "Fetching subscriptions",
          level: "info",
        });
        const response = await fetch(
          `/api/subscriptions?email=${encodeURIComponent(user.email)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch subscriptions");
        const data = await response.json();
        return data.subscriptions || [];
      } catch (error) {
        handleApiError(error);
      }
    },
    enabled: Boolean(isAuthenticated && token && user?.email),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useSubscribeMutation = () => {
  const queryClient = useQueryClient();
  const { token, user } = useUserStore();

  return useMutation({
    mutationFn: async ({ channelId, action, channelTitle }) => {
      try {
        if (!user?.email) {
          throw new Error("User email required");
        }

        Sentry.addBreadcrumb({
          category: "subscriptions",
          message: `${action} subscription`,
          level: "info",
        });

        const response = await fetch("/api/subscriptions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            channelId,
            action,
            channelTitle,
            email: user.email,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update subscription status");
        }

        return response.json();
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: handleApiError,
  });
};

export const useIsSubscribed = (channelId) => {
  const { isAuthenticated, token, user } = useUserStore();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["isSubscribed", channelId],
    queryFn: async () => {
      try {
        // First check if we have the data in the subscriptions query cache
        const subscriptionsCache = queryClient.getQueryData(["subscriptions"]);
        if (subscriptionsCache) {
          const channelSubscription = subscriptionsCache.find(
            (sub) => sub.channel_id === channelId
          );
          if (channelSubscription) {
            return channelSubscription.is_subscribed;
          }
        }

        // If no cache, then fetch from API
        Sentry.addBreadcrumb({
          category: "subscriptions",
          message: "Checking subscription status",
          level: "info",
        });
        const response = await fetch(
          `/api/subscriptions?channelId=${channelId}&email=${encodeURIComponent(
            user.email
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok)
          throw new Error("Failed to check subscription status");
        const data = await response.json();
        return data.isSubscribed ?? false;
      } catch (error) {
        handleApiError(error);
      }
    },
    enabled: Boolean(isAuthenticated && token && user?.email && channelId),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useChannelInfo = (subscriptions) => {
  return useQuery({
    queryKey: ["channelInfo", subscriptions],
    queryFn: async () => {
      if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
        return [];
      }

      try {
        const channelIds = subscriptions.map(sub => sub.channel_id);
        const uniqueChannelIds = [...new Set(channelIds)];

        // Fetch channel info
        const channels = await Promise.all(
          uniqueChannelIds.map(async (channelId) => {
            try {
              // Get channel info
              const channelResponse = await axios.get("/api/youtube/channels", {
                params: {
                  part: "snippet,statistics",
                  id: channelId,
                },
              });

              // Get channel's recent videos
              const videosResponse = await axios.get("/api/youtube/search", {
                params: {
                  part: "snippet",
                  channelId: channelId,
                  order: "date",
                  type: "video",
                  maxResults: 12,
                },
              });

              // Get full video details for the channel's videos
              const videoIds = videosResponse.data.items.map(
                (item) => item.id.videoId
              );
              const videoDetailsResponse = await axios.get("/api/youtube/videos", {
                params: {
                  part: "snippet,statistics,contentDetails",
                  id: videoIds.join(","),
                },
              });

              return {
                channelInfo: {
                  channel_id: channelId,
                  channel_title: channelResponse.data.items[0]?.snippet?.title,
                  snippet: channelResponse.data.items[0]?.snippet,
                  statistics: channelResponse.data.items[0]?.statistics,
                },
                videos: videoDetailsResponse.data.items || [],
              };
            } catch (error) {
              console.error(`Error fetching data for channel ${channelId}:`, error);
              return null;
            }
          })
        );

        // Filter out any failed channel requests
        return channels.filter(Boolean);
      } catch (error) {
        console.error("Error in useChannelInfo:", error);
        throw error;
      }
    },
    enabled: Boolean(subscriptions?.length > 0),
    staleTime: STALE_TIME,
    cacheTime: CACHE_TIME
  });
};