const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  experimental: {
    appDir: true,
  },
  images: {
    domains: ["localhost"],
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001",
  },
  // Serve static files from public directory
  async rewrites() {
    return [
      {
        source: "/thumbnails/:path*",
        destination: "/api/thumbnails/:path*",
      },
    ];
  },
  // Configure static file serving
  async headers() {
    return [
      {
        source: "/thumbnails/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
};

const sentryWebpackPluginOptions = {
  silent: true,
  org: 'lifestyle-design-realty',
  project: 'lifestyle-design-social'
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
