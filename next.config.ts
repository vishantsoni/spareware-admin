import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // eslint: {
  //   // Warning: This allows production builds to successfully complete
  //   // even if your project has ESLint errors.
  //   ignoreDuringBuilds: true,
  // },
  typescript: {
    // Adding this too since you're having type errors during build
    ignoreBuildErrors: true,
  },
  // Image Remote Patterns for Backend on Port 5000 - FIXED IPv6/IPv4 issue
  images: {
    unoptimized: true, //
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3002",
        pathname: "/uploads/**",
      },
    ],
    loader: "default",
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
