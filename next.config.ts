import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [65, 68, 70, 72, 75, 78, 80, 82],
  },
};

export default nextConfig;
