"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import useUserStore from "@/hooks/useStore";
import { ImSpinner } from "react-icons/im";

// Routes that require authentication
const protectedRoutes = [
  "/studio",
  "/playlist",
  "/liked-videos",
  "/saved-videos",
  "/subscriptions",
  "/settings",
  "/history",
  "/your-videos",
];

// Add routes that should redirect if already authenticated
const authRoutes = ["/auth"];

export function AuthProvider({ children }) {
  const { isAuthenticated, loading } = useUserStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Handle protected routes
      if (
        protectedRoutes.some((route) => pathname.startsWith(route)) &&
        !isAuthenticated
      ) {
        router.push("/auth");
      }

      // Handle auth routes (redirect if already authenticated)
      if (
        authRoutes.some((route) => pathname.startsWith(route)) &&
        isAuthenticated
      ) {
        router.push("/");
      }
    }
  }, [isAuthenticated, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <ImSpinner className="animate-spin h-8 w-8" />
        <span>Loading...</span>
      </div>
    );
  }

  return children;
}
