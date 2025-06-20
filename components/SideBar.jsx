"use client";
import { useState } from "react"
import useUIStore from "@/hooks/useUIStore"
import useUserStore from "@/hooks/useStore"
import {
  Home,
  TrendingUpIcon as Trending,
  ShoppingCartIcon as Subscriptions,
  History,
  PlayCircle,
  Bookmark,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  Music2,
  Film,
  Lock
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const mainMenuItems = [
  { icon: Home, text: "Home", link: "/" },
  { icon: Trending, text: "Trending", link: "/trending" },
  { icon: Subscriptions, text: "Subscriptions", link: "/subscriptions", requiresAuth: true }
]

const libraryItems = [
  { icon: History, text: "History", link: "/history", requiresAuth: true },
  { icon: PlayCircle, text: "Your videos", link: "/your-videos", requiresAuth: true },
  { icon: Bookmark, text: "Saved videos", link: "/saved-videos", requiresAuth: true },
  { icon: ThumbsUp, text: "Liked videos", link: "/liked-videos", requiresAuth: true }
]

const exploreItems = [
  { icon: Music2, text: "Music", link: "/music" },
  { icon: Film, text: "Movies", link: "/movies" },
  { icon: Gamepad2, text: "Gaming", link: "/gaming" }
]

const SideBar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const { isSidebarOpen } = useUIStore()
  const { isAuthenticated } = useUserStore()

  const handleNavigation = (item) => {
    router.push(item.link)
  }

  const NavItem = ({ item }) => {
    const content = (
      <div
        onClick={() => handleNavigation(item)}
        className={cn(
          "flex items-center px-6 py-3 hover:bg-accent rounded-lg transition-colors cursor-pointer",
          pathname === item.link && "bg-accent",
          item.requiresAuth && !isAuthenticated && "opacity-75"
        )}
      >
        <item.icon className="h-5 w-5 mr-4" />
        <span className="flex-1">{item.text}</span>
        {item.requiresAuth && !isAuthenticated && (
          <Lock className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    )

    if (item.requiresAuth && !isAuthenticated) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent>
              <p>Sign in to access {item.text.toLowerCase()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return content
  }

  return (
    <aside className={cn(
      "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background border-r overflow-y-auto transition-transform duration-300 ease-in-out z-50",
      "w-64 transform md:translate-x-0",
      isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      <nav className="p-4 space-y-4">
        <div className="space-y-1">
          {mainMenuItems.map((item) => (
            <NavItem key={item.link} item={item} />
          ))}
        </div>

        <div className="pt-4 border-t">
          <div className="space-y-1">
            {libraryItems.map((item) => (
              <NavItem key={item.link} item={item} />
            ))}
          </div>
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 mr-4" />
              ) : (
                <ChevronDown className="h-5 w-5 mr-4" />
              )}
              {isExpanded ? "Show less" : "Explore"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {exploreItems.map((item) => (
              <NavItem key={item.link} item={item} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </nav>
    </aside>
  )
}

export default SideBar