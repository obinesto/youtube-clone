"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useUIStore from "@/store/sidebarStore";
import authStore from "@/store/authStore";
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
  Lock,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const mainMenuItems = [
  { icon: Home, text: "Home", link: "/" },
  { icon: Trending, text: "Trending", link: "/trending" },
  {
    icon: Subscriptions,
    text: "Subscriptions",
    link: "/subscriptions",
    requiresAuth: true,
  },
];

const libraryItems = [
  { icon: History, text: "History", link: "/history", requiresAuth: true },
  {
    icon: PlayCircle,
    text: "Your videos",
    link: "/your-videos",
    requiresAuth: true,
  },
  {
    icon: Bookmark,
    text: "Saved videos",
    link: "/saved-videos",
    requiresAuth: true,
  },
  {
    icon: ThumbsUp,
    text: "Liked videos",
    link: "/liked-videos",
    requiresAuth: true,
  },
];

const exploreItems = [
  { icon: Music2, text: "Music", link: "/music" },
  { icon: Film, text: "Movies", link: "/movies" },
  { icon: Gamepad2, text: "Gaming", link: "/gaming" },
];

const SideBar = () => {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const { isSidebarOpen, closeSidebar } = useUIStore();
  const { isAuthenticated } = authStore();

  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  const handleNavigation = () => {
    if (isSidebarOpen) {
      closeSidebar();
    }
  };

  const NavItem = ({ item }) => {
    const isActive =
      item.link === "/" ? pathname === item.link : pathname.startsWith(item.link);

    const content = (
      <Link
        href={item.link}
        onClick={handleNavigation}
        className={cn(
          "flex min-h-11 cursor-pointer items-center rounded-lg px-4 py-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent font-medium text-accent-foreground",
          item.requiresAuth && !isAuthenticated && "opacity-75"
        )}
      >
        <item.icon className="mr-4 h-5 w-5 shrink-0" />
        <span className="flex-1">{item.text}</span>
        {item.requiresAuth && !isAuthenticated && (
          <Lock className="h-4 w-4 text-muted-foreground" />
        )}
      </Link>
    );

    if (item.requiresAuth && !isAuthenticated) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent>
              <p>Sign in to access {item.text.toLowerCase()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <div className="contents">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="app-sidebar-backdrop fixed inset-x-0 bottom-0 top-14 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
          onClick={closeSidebar}
        />
      )}
      <aside
        data-open={isSidebarOpen}
        className={cn(
          "app-sidebar fixed bottom-0 left-0 top-14 z-50 w-[min(18rem,85vw)] overflow-y-auto border-r border-border/70 bg-card/80 text-foreground shadow-sm shadow-black/[0.03] backdrop-blur-xl transition-transform duration-300 ease-in-out dark:bg-background dark:text-foreground md:static md:z-auto md:h-full md:min-h-0 md:w-64 md:self-stretch md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <nav className="space-y-4 p-3 sm:p-4">
          <div className="space-y-1">
            {mainMenuItems.map((item) => (
              <NavItem key={item.link} item={item} />
            ))}
          </div>

          <div className="border-t pt-4">
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
                  <ChevronUp className="mr-4 h-5 w-5" />
                ) : (
                  <ChevronDown className="mr-4 h-5 w-5" />
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
    </div>
  );
};

export default SideBar;
