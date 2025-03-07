"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import useUserStore from "@/hooks/useStore";

// Routes that require authentication
const protectedRoutes = [
  "/studio",
  "/playlist",
  "/liked-videos",
  "/watch-later",
  "/subscriptions"
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
      if (protectedRoutes.some(route => pathname.startsWith(route)) && !isAuthenticated) {
        router.push("/auth");
      }
      
      // Handle auth routes (redirect if already authenticated)
      if (authRoutes.some(route => pathname.startsWith(route)) && isAuthenticated) {
        router.push("/");
      }
    }
  }, [isAuthenticated, loading, pathname, router]);

  // if (loading) {
  //   return null
  // might create a stylish loading animation here later
  // }

  return children;
}