"use client";
import { Separator } from "@/components/ui/separator";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
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
    <footer className="md:w-3/4 md:ml-80 bg-customWhite dark:bg-customDark text-customDark dark:text-customWhite">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 gap-6">
          <Card className="bg-transparent border-none shadow-none">
            <CardHeader>
              <CardTitle className="flex text-center text-xl">
                YouTube Clone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="flex text-center text-muted-foreground">
                A project built with Next.js and React
              </p>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-none shadow-none">
            <CardHeader>
              <CardTitle className="flex text-center text-lg">
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NavigationMenu>
                <NavigationMenuList className="flex flex-col space-y-2">
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                    >
                      <Link href="/">Home</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                    >
                      <Link href="/trending" passHref>
                        Trending
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                    >
                      <Link href="/subscriptions" passHref>
                        Subscriptions
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                      <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                    >
                      <Link href="/library" passHref>
                        Library
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-none shadow-none">
            <CardHeader className="mb-8 md:mb-0">
              <CardTitle className="text-lg">Connect</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
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
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        <div className="text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date(Date.now()).getFullYear()} YouTube Clone . All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
