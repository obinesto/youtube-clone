"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const NavBar = () => {
  const { user, logout } = useUserStore();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { watchHistory, likedVideos, savedVideos, userVideos } =
    useProtectedFeatures();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Update notifications when protected features change
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
            className="w-full py-2 px-4 rounded-full bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-customRed"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <Search className="h-4 w-4 text-gray-500 dark:text-gray-300" />
          </Button>
        </div>
      </div>

      {/* Mobile Search Dialog */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:hidden p-0">
          <div className="flex items-center p-4 gap-2">
            <Input
              type="text"
              placeholder="Search"
              className="flex-1"
              autoFocus
            />
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search className="h-5 w-5" />
        </Button>

        {user && (
          <>
            {/* Mobile Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden relative" // Show only on mobile
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

            {/* Desktop Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:inline-flex relative"
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
    </nav>
  );
};

export default NavBar;
