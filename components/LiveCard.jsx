"use client";
import Link from "next/link"

const LiveCard = ({ id, title, thumbnail, viewers }) => {
  return (
    <Link href={`/live/${id}`} className="block">
      <div className="bg-customWhite dark:bg-customDark rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="relative">
          <img src={thumbnail || "/placeholder.svg"} alt={title} className="w-full h-48 object-cover" />
          <div className="absolute top-2 left-2 bg-customRed text-customWhite px-2 py-1 rounded text-sm font-semibold">
            LIVE
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-customDark dark:text-customWhite mb-2 line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{viewers} watching</p>
        </div>
      </div>
    </Link>
  )
}

export default LiveCard