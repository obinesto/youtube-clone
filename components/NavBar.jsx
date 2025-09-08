"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Menu,
  Bell,
  User,
  LogOut,
  Settings,
  X,
  Upload,
  VideoIcon,
  Bookmark,
  ThumbsUp,
} from "lucide-react";
import useUserStore from "@/hooks/useStore";
import useUIStore from "@/hooks/useUIStore";
import { useSearchVideos } from "@/hooks/useQueries";
import { useProtectedFeatures } from "@/hooks/useProtectedFeatures";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogPortal } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const NavBar = () => {
  const { user, logout } = useUserStore();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const [query, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const { data: searchVideos, isLoading } = useSearchVideos(debouncedQuery);
  const { watchHistory, likedVideos, savedVideos, userVideos } =
    useProtectedFeatures();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // 500ms delay

    return () => clearTimeout(timer); // makes the function restart on every keystroke since query is a dependency. So it will only pass a value when 500ms has elapsed without a keystroke
  }, [query]);

  useEffect(() => {
    if (!user) return;

    const newNotifications = [];
    if (savedVideos?.length > 0) {
      newNotifications.push({
        id: "saved-videos",
        message: `${savedVideos.length} videos in Saved Videos`,
        link: "/saved-videos",
      });
    }
    if (likedVideos?.length > 0) {
      newNotifications.push({
        id: "liked",
        message: `${likedVideos.length} Liked videos`,
        link: "/liked-videos",
      });
    }
    if (watchHistory?.length > 0) {
      newNotifications.push({
        id: "watch-history",
        message: `${watchHistory.length} videos in Watch History`,
        link: "/history",
      });
    }
    setNotifications(newNotifications);
  }, [user, watchHistory, likedVideos, savedVideos]);

  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submission (Enter key or button click) - uses immediate query for responsiveness
  const handleSearchSubmit = () => {
    if (!query.trim()) return;
    setIsSearchOpen(false);
    router.push(`/search/${query}`);
    setSearchQuery("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearchSubmit();
    }
  };

  return (
    <nav className="bg-customWhite dark:bg-customDark text-customDark dark:text-customWhite py-2 sm:py-4 px-4 sm:px-6 flex items-center justify-between fixed w-full top-0 z-50">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
        <Link href="/" className="flex items-center">
          <span className="text-lg sm:text-xl md:text-2xl font-bold text-customRed whitespace-nowrap">
            YouTube Clone
          </span>
        </Link>
      </div>

      {/* Desktop Search */}
      <div className="hidden sm:block flex-1 max-w-xl mx-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search"
            value={query}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className="w-full py-2 px-4 rounded-full bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-customRed"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={handleSearchSubmit}
            disabled={!query}
            aria-label="Search"
          >
            <Search className="h-4 w-4 text-gray-500 dark:text-gray-300" />
          </Button>
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-8 top-1/2 transform -translate-y-1/2"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4 text-gray-500 dark:text-gray-300" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Search */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Mobile Search Dialog */}
        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogPortal>
            <DialogPrimitive.Content
              className={cn(
                "sm:hidden fixed w-full top-12 z-50 bg-background shadow-lg p-0",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]"
              )}
            >
              <div className="relative flex items-center p-4 ml-4">
                <Input
                  type="text"
                  placeholder="Search"
                  value={query}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-8 top-1/2 transform -translate-y-1/2"
                  onClick={handleSearchSubmit}
                  disabled={!query}
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
              <DialogPrimitive.Close
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                )}
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>

        {user && (
          <>
            {/* Desktop upload Button */}
            <Link href="/studio/upload">
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex"
                aria-label="Upload video"
              >
                <Upload className="h-5 w-5" />
              </Button>
            </Link>

            {/* Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="inline-flex relative"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
                    >
                      {notifications.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} asChild>
                      <Link
                        href={notification.link}
                        className="flex items-center gap-2"
                      >
                        {notification.id === "saved-videos" ? (
                          <Bookmark className="h-4 w-4" />
                        ) : notification.id === "liked" ? (
                          <ThumbsUp className="h-4 w-4" />
                        ) : notification.id === "watch-history" ? (
                          <VideoIcon className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" /> // Fallback
                        )}
                        <span>{notification.message}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar>
                  <AvatarImage
                    src={user.photoURL || undefined}
                    alt={user.email || "User"}
                  />
                  <AvatarFallback>
                    {user.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.photoURL || undefined}
                    alt={user.email || "User"}
                  />
                  <AvatarFallback>
                    {user.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 leading-none">
                  {user.email && (
                    <p className="font-medium text-sm truncate">{user.email}</p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/your-videos" className="flex items-center">
                    <VideoIcon className="mr-2 h-4 w-4" />
                    <span>Your videos</span>
                    {userVideos?.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {userVideos.length}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/saved-videos" className="flex items-center">
                    <Bookmark className="mr-2 h-4 w-4" />
                    <span>Saved videos</span>
                    {savedVideos?.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {savedVideos.length}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              {/* Mobile Upload Link in User Dropdown */}
              <DropdownMenuItem asChild className="sm:hidden">
                <Link href="/studio/upload" className="flex items-center">
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Upload video</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/auth">
            <Button
              variant="default"
              className="bg-customRed hover:bg-customRed/90 h-8 px-3 sm:px-4"
              size="sm"
            >
              <User className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          </Link>
        )}
      </div>
      {/* search results */}
      {query && (
        <div className="fixed top-16 left-0 right-0 md:left-12 z-[49] pointer-events-none">
          <div className="max-w-3xl mx-auto px-2 sm:px-4 pointer-events-auto">
            <Card className="search-results p-4 max-h-80 overflow-y-auto overflow-x-hidden shadow-lg">
              {isLoading ? (
                <div>
                  {/* Example Skeleton Loaders */}
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-6 w-1/2 mb-3" />
                  <Skeleton className="h-6 w-2/3 mb-3" />
                </div>
              ) : searchVideos && searchVideos.length > 0 ? (
                <>
                  <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed mb-2">
                    Search Results
                  </h1>
                  <ul className="space-y-1">
                    {searchVideos.map((video) => (
                      <li key={video.id.videoId} className="flex items-center">
                        <Search className="h-4 w-4 mr-2" />
                        <Link
                          href={`/search/${video.snippet.title || query}`}
                          className="block p-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-customDark dark:text-customWhite"
                          onClick={() => setSearchQuery("")}
                        >
                          {video.snippet.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No results found for "{query}".
                </p>
              )}
            </Card>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
