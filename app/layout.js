import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/app/components/mode/ThemeProvider";
import NavBar from "@/app/components/NavBar";
import SideBar from "@/app/components/SideBar";
import Footer from "@/app/components/Footer";
import ModeToggle from "@/app/components/mode/ModeToggle";
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
  url: "https://youtube-clone.vercel.app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
          <ThemeProvider>
            <NavBar />
            <div className="flex">
              <SideBar />
              <main className="flex-1 ml-64">{children}</main>
            </div>
            <Footer />
            <div className="fixed bottom-4 right-4 z-50">
              <ModeToggle />
            </div>
          </ThemeProvider>
      </body>
    </html>
  );
}
