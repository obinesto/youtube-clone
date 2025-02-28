"use client";
import Link from "next/link"
import { formatDistanceToNow, parseISO } from "date-fns"

const VideoCard = ({ id, title, thumbnail, channelTitle, publishedAt }) => {
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      console.error("Invalid date:", dateString)
      return "Date unavailable"
    }
  }

  return (
    <Link href={`/video/${id}`} className="block">
      <div className="bg-customWhite dark:bg-customDark rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
        <img src={thumbnail || "/placeholder.svg"} alt={title} className="w-full h-48 object-cover" />
        <div className="p-4">
          <h3 className="text-lg font-semibold text-customDark dark:text-customWhite mb-1 line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{channelTitle}</p>
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            <span>{formatDate(publishedAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default VideoCard