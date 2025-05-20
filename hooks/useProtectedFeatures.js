import { useCallback } from "react";
import { useRouter } from "next/navigation";
import useUserStore from "./useStore";
import {
  // Queries
  useWatchHistory,
  useLikedVideos,
  useSavedVideos,
  useUserVideos,
  // Mutations
  useVideoLikeMutation,
  useSavedVideoMutation,
  useVideoMutation,
  // Status Queries
  useIsVideoLiked,
  useIsInSavedVideos,
} from "./useQueries";

export function useProtectedFeatures(videoId) {
  const router = useRouter();
  const { isAuthenticated, user, token } = useUserStore();
  const userEmail = user?.email;

  // Queries
  const { data: watchHistory, isLoading: isLoadingHistory } = useWatchHistory();
  const { data: likedVideos, isLoading: isLoadingLikes } = useLikedVideos();
  const { data: savedVideos, isLoading: isLoadingSavedVideos } =
    useSavedVideos();
  const { data: userVideos, isLoading: isLoadingUserVideos } = useUserVideos();

  // Mutations
  const likeMutation = useVideoLikeMutation();
  const savedVideoMutation = useSavedVideoMutation();
  const videoMutation = useVideoMutation();

  // Specific Status Queries
  const { data: isLikedData, isLoading: isLoadingLikeStatus } =
    useIsVideoLiked(videoId);
  const { data: isInSavedVideosData, isLoading: isLoadingSavedVideoStatus } =
    useIsInSavedVideos(videoId);

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

    try {
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
  }, [
    isAuthenticated,
    videoId,
    isLikedData,
    likeMutation,
    router,
    userEmail,
    token,
  ]);

  const handleSavedVideo = useCallback(async () => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    if (!userEmail || !videoId) {
      console.error("Missing required data for saved video operation");
      return;
    }

    try {
      await savedVideoMutation.mutateAsync({
        videoId,
        action: isInSavedVideosData ? "remove" : "add",
        email: userEmail,
        token,
      });
    } catch (error) {
      console.error("Error adding/removing to saved videos:", error);
      throw new Error("Failed to update saved video status. Try again later.");
    }
  }, [
    isAuthenticated,
    videoId,
    isInSavedVideosData,
    savedVideoMutation,
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

  return {
    // Data
    watchHistory,
    likedVideos,
    savedVideos,
    userVideos,

    // Loading states
    isLoadingHistory,
    isLoadingLikes,
    isLoadingSavedVideos,
    isLoadingUserVideos,

    // Action handlers
    handleLike,
    handleSavedVideo,
    handleVideoAction,

    // Like and Watch Later status
    isLiked: isLikedData ?? false,
    isSaved: isInSavedVideosData ?? false,
    isLoadingLike: likeMutation.isLoading || isLoadingLikeStatus,
    isLoadingSavedVideo:
      savedVideoMutation.isLoading || isLoadingSavedVideoStatus,
  };
}
