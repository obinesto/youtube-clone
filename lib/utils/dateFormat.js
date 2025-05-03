import { formatDistanceToNow, parseISO } from "date-fns";

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = typeof dateString === "string" ? parseISO(dateString) : dateString;
  return formatDistanceToNow(date, { addSuffix: true });
};

export const formatDuration = (duration) => {
  if (!duration) return "";
  
  // YouTube duration format: PT#H#M#S
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) return "";
  
  const [, hours, minutes, seconds] = match;
  
  if (!hours && !minutes && !seconds) return "";
  
  const parts = [];
  
  if (hours) {
    parts.push(hours);
  }
  
  parts.push(minutes ? minutes.padStart(2, "0") : "00");
  parts.push(seconds ? seconds.padStart(2, "0") : "00");
  
  return parts.join(":");
};

export const formatViews = (viewCount) => {
  if (!viewCount) return "0 views";
  
  const views = Number(viewCount);
  if (isNaN(views)) return "0 views";
  
  if (views >= 1000000000) {
    return `${(views / 1000000000).toFixed(1)}B views`;
  }
  
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M views`;
  }
  
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K views`;
  }
  
  return `${views} views`;
};