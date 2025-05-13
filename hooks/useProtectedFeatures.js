import { useCallback } from "react";
import { useRouter } from "next/navigation";
import useUserStore from "./useStore";
import {
  // Queries
  useWatchHistory,
  useLikedVideos,
  useWatchLater,
  useUserVideos,
  // Mutations
  useVideoLikeMutation,
  useWatchLaterMutation,
  useVideoMutation,
  // Status Queries
  useIsVideoLiked,
  useIsInWatchLater,
} from "./useQueries";

export function useProtectedFeatures(videoId) {
  const router = useRouter();
  const { isAuthenticated, user, token } = useUserStore();
  const userEmail = user?.email;

  // Queries
  const { data: watchHistory, isLoading: isLoadingHistory } = useWatchHistory();
  const { data: likedVideos, isLoading: isLoadingLikes } = useLikedVideos();
  const { data: watchLater, isLoading: isLoadingWatchLater } = useWatchLater();
  const { data: userVideos, isLoading: isLoadingUserVideos } = useUserVideos();

  // Mutations
  const likeMutation = useVideoLikeMutation();
  const watchLaterMutation = useWatchLaterMutation();
  const videoMutation = useVideoMutation();

  // Specific Status Queries
  const { data: isLikedData, isLoading: isLoadingLikeStatus } =
    useIsVideoLiked(videoId);
  const { data: isInWatchLaterData, isLoading: isLoadingWatchLaterStatus } =
    useIsInWatchLater(videoId);

  // Action Handlers
  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    if (!userEmail || !videoId) {
      console.error("Missing required data for like operation");
      return;
    }

    try{
      await likeMutation.mutateAsync({
        videoId,
        action: isLikedData ? "unlike" : "like",
        email: userEmail,
        token,
      });
    } catch (error) {
      console.error("Error liking/unliking video:", error);
      throw new Error("Failed to update like status. Try again later.");
    }
  }, [isAuthenticated, videoId, isLikedData, likeMutation, router, userEmail, token]);

  const handleWatchLater = useCallback(async () => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    if (!userEmail || !videoId) {
      console.error("Missing required data for watch later operation");
      return;
    }

    try {
      await watchLaterMutation.mutateAsync({
        videoId,
        action: isInWatchLaterData ? "remove" : "add",
        email: userEmail,
        token,
      });
    } catch (error) {
      console.error("Error adding/removing to watch later:", error);
      throw new Error("Failed to update watch later status. Try again later.");
    }
  }, [
    isAuthenticated,
    videoId,
    isInWatchLaterData,
    watchLaterMutation,
    router,
    userEmail,
    token,
  ]);

  const handleVideoAction = useCallback(
    async (type, actionVideoId, data) => {
      if (!isAuthenticated) {
        router.push("/auth");
        return;
      }
      if (!videoMutation) {
        console.error("videoMutation is not available");
        return;
    }
      return videoMutation.mutateAsync({ type, videoId: actionVideoId, data });
    },
    [isAuthenticated, videoMutation, router]
  );

  const checkVideoStatus = useCallback(
    (checkVideoId) => {
      if (!isAuthenticated) return {};

      return {
        isLiked: likedVideos?.some((v) => v.video_id === checkVideoId),
        isSaved: watchLater?.some((v) => v.video_id === checkVideoId),
        isOwned: userVideos?.some((v) => v.id === checkVideoId),
      };
    },
    [isAuthenticated, likedVideos, watchLater, userVideos]
  );
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

    // Like and Watch Later status
    isLiked: isLikedData ?? false,
    isInWatchLater: isInWatchLaterData ?? false,
    isLoadingLike: likeMutation.isLoading || isLoadingLikeStatus,
    isLoadingWatchLater: watchLaterMutation.isLoading || isLoadingWatchLaterStatus,
  };
}
