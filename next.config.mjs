import { withSentryConfig } from "@sentry/nextjs";
/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },

      {
        protocol: "https",
        hostname: "yt3.ggpht.com",
      },
    ],
  },
};

const mergedConfig = {
  ...nextConfig,
  async headers() {
      return [
          {
              source: "/(.*)",
              headers: [
                  { key: "X-Content-Type-Options", value: "nosniff" },
                  { key: "X-Frame-Options", value: "DENY" },
                  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
              ],
          },
          {
              source: "/sw.js",
              headers: [
                  { key: "Content-Type", value: "application/javascript; charset=utf-8" },
                  { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
                  { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
              ],
          },
      ];
  }
};

export default withSentryConfig(mergedConfig, {
  org: "cyprian-obi",
  project: "youtube-clone",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
});
