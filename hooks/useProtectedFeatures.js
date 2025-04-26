import { useCallback, useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useQuery } from "@tanstack/react-query";
import useUserStore from './useStore';
import {
  useWatchHistory,
  useAddToHistory,
  useClearHistory,
  useLikedVideos,
  useVideoLike,
  useWatchLater,
  useWatchLaterMutation,
  useUserVideos,
  useVideoMutation,
} from './useQueries';

export function useProtectedFeatures(videoId) {
  const router = useRouter();
  const { isAuthenticated, user } = useUserStore();

  // History features
  const { data: watchHistory, isLoading: isLoadingHistory } = useWatchHistory();
  const addToHistory = useAddToHistory();
  const clearHistory = useClearHistory();

  // Likes features
  const { data: likedVideos, isLoading: isLoadingLikes } = useLikedVideos();
  const likeMutation = useVideoLike();

  // Watch Later features
  const { data: watchLater, isLoading: isLoadingWatchLater } = useWatchLater();
  const watchLaterMutation = useWatchLaterMutation();

  // User Videos features
  const { data: userVideos, isLoading: isLoadingUserVideos } = useUserVideos();
  const videoMutation = useVideoMutation();
  // Check if video is liked
  const { data: likeStatus } = useQuery({
    queryKey: ["videoLike", videoId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/likes?email=${encodeURIComponent(user.email)}`);
        const data = await response.json();
        if (!response.ok) {
          console.error("Like status error:", data.error);
          return false;
        }
        return data.likes?.some(like => like.video_id === videoId) || false;
      } catch (error) {
        console.error("Failed to fetch like status:", error);
        return false;
      }
    },
    enabled: Boolean(isAuthenticated && user?.email && videoId),
  });
  // Check if video is in watch later
  const { data: watchLaterStatus } = useQuery({
    queryKey: ["watchLater", videoId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/watch-later?email=${encodeURIComponent(user.email)}`);
        const data = await response.json();
        if (!response.ok) {
          console.error("Watch later status error:", data.error);
          return false;
        }
        return data.watchLater?.some(item => item.video_id === videoId) || false;
      } catch (error) {
        console.error("Failed to fetch watch later status:", error);
        return false;
      }
    },
    enabled: Boolean(isAuthenticated && user?.email && videoId),
  });

  // Update states when data changes
  const [isLiked, setIsLiked] = useState(false);
  const [isInWatchLater, setIsInWatchLater] = useState(false);

  useEffect(() => {
    if (likeStatus !== undefined) {
      setIsLiked(likeStatus);
    }
  }, [likeStatus]);

  useEffect(() => {
    if (watchLaterStatus !== undefined) {
      setIsInWatchLater(watchLaterStatus);
    }
  }, [watchLaterStatus]);  // Helper functions with auth checks
  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/auth');
      return false;
    }

    if (!user?.email || !videoId) {
      console.error("Missing required data for like operation");
      return false;
    }

    try {
      const result = await likeMutation.mutateAsync({
        videoId,
        action: isLiked ? "unlike" : "like",
        email: user.email,
      });
      if (result?.success) {
        setIsLiked(!isLiked);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update like status:", error);
      return false;
    }
  }, [isAuthenticated, videoId, isLiked, likeMutation, router, user?.email]);  const handleWatchLater = useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/auth');
      return false;
    }

    if (!user?.email || !videoId) {
      console.error("Missing required data for watch later operation");
      return false;
    }

    try {
      const result = await watchLaterMutation.mutateAsync({
        videoId,
        action: isInWatchLater ? "remove" : "add",
        email: user.email,
      });
      if (result?.success) {
        setIsInWatchLater(!isInWatchLater);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update watch later status:", error);
      return false;
    }
  }, [isAuthenticated, videoId, isInWatchLater, watchLaterMutation, router, user?.email]);

  const handleVideoAction = useCallback(async (type, videoId, data) => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    return videoMutation.mutateAsync({ type, videoId, data });
  }, [isAuthenticated, videoMutation, router]);

  const checkVideoStatus = useCallback((videoId) => {
    if (!isAuthenticated) return {};
    
    return {
      isLiked: likedVideos?.some(v => v.video_id === videoId),
      isSaved: watchLater?.some(v => v.video_id === videoId),
      isOwned: userVideos?.some(v => v.id === videoId),
    };
  }, [isAuthenticated, likedVideos, watchLater, userVideos]);

  return {
    // Data
    watchHistory,
    likedVideos,
    watchLater,
    userVideos,

    // Loading states
    isLoadingHistory,
    isLoadingLikes,
    isLoadingWatchLater,
    isLoadingUserVideos,

    // Action handlers
    handleLike,
    handleWatchLater,
    handleVideoAction,
    checkVideoStatus,

    // Direct mutations if needed
    addToHistory,
    clearHistory,
    likeMutation,
    watchLaterMutation,
    videoMutation,

    // Like and Watch Later status
    isLiked,
    isInWatchLater,
    isLoadingLike: likeMutation.isLoading,
    isLoadingWatchLater: watchLaterMutation.isLoading,
  };
}