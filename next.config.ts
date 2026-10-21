import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Notice screenshots and PDFs (up to 10 MB, PayPal's evidence limit) are sent to a Server Action.
  experimental: { serverActions: { bodySizeLimit: "11mb" } },
  cacheComponents: true,
  partialPrefetching: true,
  // 85 is used for the landing hero photos (public/landing); 75 stays the default everywhere else.
  images: { qualities: [75, 85] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
