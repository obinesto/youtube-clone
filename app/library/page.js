"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ThumbsUp, Clock, PlayCircle } from "lucide-react";
import useUserStore from "@/hooks/useStore";

const sections = [
  {
    title: "History",
    icon: History,
    path: "/history",
    description: "Watch history"
  },
  {
    title: "Your Videos",
    icon: PlayCircle,
    path: "/your-videos",
    description: "Videos you've created"
  },
  {
    title: "Watch Later",
    icon: Clock,
    path: "/watch-later",
    description: "Videos you've saved for later"
  },
  {
    title: "Liked Videos",
    icon: ThumbsUp,
    path: "/liked-videos",
    description: "Videos you've liked"
  }
];

export default function LibraryPage() {
  const { isAuthenticated } = useUserStore();
  const router = useRouter();

  if (!isAuthenticated) return null;

  return (
    <div className="container mx-auto px-4 pt-16">
      <h1 className="text-xl md:text-2xl font-bold text-customRed dark:text-customRed">Library</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((section) => (
          <Card 
            key={section.path}
            className="hover:bg-accent cursor-pointer transition-colors"
            onClick={() => router.push(section.path)}
          >
            <CardHeader className="flex flex-row items-center space-x-4 pb-2">
              <section.icon className="h-5 w-5" />
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}