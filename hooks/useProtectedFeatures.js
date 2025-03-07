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
      const response = await fetch(`/api/likes?email=${encodeURIComponent(user.email)}`);
      if (!response.ok) throw new Error("Failed to fetch like status");
      const data = await response.json();
      return data.likes?.some(like => like.video_id === videoId) || false;
    },
    enabled: Boolean(isAuthenticated && user?.email && videoId),
  });

  // Check if video is in watch later
  const { data: watchLaterStatus } = useQuery({
    queryKey: ["watchLater", videoId],
    queryFn: async () => {
      const response = await fetch(`/api/watch-later?email=${encodeURIComponent(user.email)}`);
      if (!response.ok) throw new Error("Failed to fetch watch later status");
      const data = await response.json();
      return data.watchLater?.some(item => item.video_id === videoId) || false;
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
  }, [watchLaterStatus]);

  // Helper functions with auth checks
  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    try {
      await likeMutation.mutateAsync({
        videoId,
        action: isLiked ? "unlike" : "like",
      });
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Failed to update like status:", error);
      throw error;
    }
  }, [isAuthenticated, videoId, isLiked, likeMutation, router]);

  const handleWatchLater = useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    try {
      await watchLaterMutation.mutateAsync({
        videoId,
        action: isInWatchLater ? "remove" : "add",
      });
      setIsInWatchLater(!isInWatchLater);
    } catch (error) {
      console.error("Failed to update watch later status:", error);
      throw error;
    }
  }, [isAuthenticated, videoId, isInWatchLater, watchLaterMutation, router]);

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