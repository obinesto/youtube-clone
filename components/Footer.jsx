"use client";
import { Separator } from "@/components/ui/separator";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";

const Footer = () => {
  const socialLinks = [
    {
      name: "GitHub",
      icon: <FaGithub className="h-4 w-4" />,
      href: "https://github.com/obinesto/youtube-clone",
      description: "Check out the source code",
    },
    {
      name: "LinkedIn",
      icon: <FaLinkedin className="h-4 w-4" />,
      href: "https://www.linkedin.com/in/cyprian-obi-6306b4183",
      description: "Connect with me professionally",
    },
    {
      name: "Twitter",
      icon: <FaTwitter className="h-4 w-4" />,
      href: "https://www.x.com/Mc_Cprian02",
      description: "Follow for updates",
    },
  ];

  return (
    <footer className="container ml-0 md:ml-64 mx-auto overflow-hidden mt-4 bg-customWhite dark:bg-customDark text-customDark dark:text-customWhite">
      <div className="grid md:grid-cols-3">
        <Card className="flex flex-col items-center bg-transparent border-none shadow-none">
          <CardHeader>
            <CardTitle className="flex text-center text-xl">
              YouTube Clone
            </CardTitle>
          </CardHeader>
          <CardContent className="px-16">
            <p className="text-center text-muted-foreground">
              A project built with Next.js, React, and Supabase.
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center bg-transparent border-none shadow-none">
          <CardHeader>
            <CardTitle className="flex text-center text-lg">
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent className="flex px-16 gap-4 text-muted-foreground">
            <Link href="/" className=" hover:text-customRed transition-colors">
              Home
            </Link>

            <Link
              href="/trending"
              passHref
              className=" hover:text-customRed transition-colors"
            >
              Trending
            </Link>

            <Link
              href="/subscriptions"
              passHref
              className=" hover:text-customRed transition-colors"
            >
              Subscriptions
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center bg-transparent border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Connect</CardTitle>
          </CardHeader>
          <CardContent className="flex px-16 gap-4">
            {socialLinks.map((link) => (
              <HoverCard key={link.name} openDelay={200}>
                <HoverCardTrigger asChild>
                  <Link
                    href={link.href}
                    target="blank"
                    className="flex items-center space-x-2 text-muted-foreground hover:text-customRed transition-colors"
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                </HoverCardTrigger>
                <HoverCardContent className="w-auto">
                  <div className="flex items-center space-x-2">
                    {link.icon}
                    <div>
                      <h4 className="text-sm font-semibold">{link.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      <div className="text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getUTCFullYear()} YouTube Clone . All rights
          reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
