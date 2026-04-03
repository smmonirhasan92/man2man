import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  customWorkerSrc: "worker",
  cacheOnFrontEndNav: false, // Disabling to prevent White Screen on Back Button (Next.js App Router Bug)
  aggressiveFrontEndNavCaching: false, // Disabling to prevent heavy cache lockups
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
          },
        },
      },
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-font-assets",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-image-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      {
        urlPattern: /\.(?:mp3|wav|ogg|m4a)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-audio-assets",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  },
});

const nextConfig = {
  transpilePackages: ['framer-motion', 'lucide-react', 'react-hot-toast', 'phaser', 'p5', 'react-p5'],
  /* config options here */
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // output: 'export' as const, // Disabled for PM2 Next Start
  images: {
    remotePatterns: [
      { protocol: 'https' as const, hostname: 'flagcdn.com' },
      { protocol: 'https' as const, hostname: 'ui-avatars.com' },
      { protocol: 'https' as const, hostname: 'usaaffiliatemarketing.com' },
      // [FIX] Allow image loading from IP and localhost for Docker/test setups
      { protocol: 'http' as const, hostname: '76.13.244.202' },
      { protocol: 'http' as const, hostname: 'localhost' },
    ]
  },
  trailingSlash: true,
};

export default withPWA(nextConfig);
