"use client";
import {
    Home,
    TrendingUpIcon as Trending,
    ShoppingCartIcon as Subscriptions,
    Library,
    History,
    PlayCircle,
    Clock,
    ThumbsUp,
    ChevronDown,
  } from "lucide-react"
  import Link from "next/link"
  
  const SideBar = () => {
    const menuItems = [
      { icon: Home, text: "Home", link: "/" },
      { icon: Trending, text: "Trending", link: "/trending" },
      { icon: Subscriptions, text: "Subscriptions", link: "/subscriptions" },
      { icon: Library, text: "Library", link: "/library" },
      { icon: History, text: "History", link: "/history" },
      { icon: PlayCircle, text: "Your videos", link: "/your-videos" },
      { icon: Clock, text: "Watch later", link: "/watch-later" },
      { icon: ThumbsUp, text: "Liked videos", link: "/liked-videos" },
    ]
  
    return (
      <aside className="w-64 bg-customWhite dark:bg-customDark text-customDark dark:text-customWhite h-screen overflow-y-auto fixed left-0 top-16">
        <nav className="py-4">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.link}
              className="flex items-center px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <item.icon className="h-6 w-6 mr-4" />
              <span>{item.text}</span>
            </Link>
          ))}
          <button className="flex items-center px-6 py-3 w-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronDown className="h-6 w-6 mr-4" />
            <span>Show more</span>
          </button>
        </nav>
      </aside>
    )
  }
  
  export default SideBar  