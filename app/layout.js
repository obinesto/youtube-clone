import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import SideBar from "@/components/SideBar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import ModeToggle from "@/components/mode/ModeToggle";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Youtube Clone",
  description: "A Youtube clone built with Next.js and Supabase",
  image: "https://og-image.vercel.app/Youtube%20Clone.png",
  url: "https://youtube-clone-cyprianobi.vercel.app/",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ErrorBoundary>
            <NavBar />
            <div className="flex min-h-screen">
              <SideBar />
              <main className="flex-1 ml-0 md:ml-64">{children}</main>
            </div>
            <Footer />
            <div className="fixed bottom-4 right-4 z-50">
              <ModeToggle />
            </div>
          </ErrorBoundary>
          <Toaster />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
