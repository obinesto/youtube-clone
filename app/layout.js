import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import SideBar from "@/components/SideBar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import ModeToggle from "@/components/mode/ModeToggle";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next"
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
  title: "Youtube Clone - By Cyprian Obi",
  description:
    "A web application that replicates the core features of YouTube.",
  author: "Cyprian Obi",
  url: "https://youtube-clone-cyprianobi.vercel.app/",
  keywords: [
    "YouTube Clone",
    "Web Application",
    "Video Sharing",
    "Cyprian Obi",
    "Next.js",
    "React",
    "Tailwind CSS",
  ],
  creator: "Cyprian Obi",
  openGraph: {
    type: "website",
    title: "Youtube Clone - By Cyprian Obi",
    description:
      "A web application that replicates the core features of YouTube.",
    url: "https://youtube-clone-cyprianobi.vercel.app/",
    images: [
      {
        url: "https://youtube-clone-cyprianobi.vercel.app/preview.png",
        width: 1200,
        height: 630,
        alt: "Youtube Clone Preview Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Youtube Clone - By Cyprian Obi",
    description:
      "A web application that replicates the core features of YouTube.",
    creator: "@Mc_Cprian02",
    images: ["https://youtube-clone-cyprianobi.vercel.app/preview.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href="/icon?<generated>"
          type="image/<generated>"
          sizes="<generated>"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
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
        <SpeedInsights/>
        <Analytics />
      </body>
    </html>
  );
}
