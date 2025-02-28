"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "@/app/pages/home/page";
import Auth from "@/app/pages/auth/page";

export default function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Home />
      <Auth/>
    </QueryClientProvider>
  );
}