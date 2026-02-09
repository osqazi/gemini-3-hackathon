import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // For specific images that should bypass optimization, we can handle this differently
    // We'll keep optimization but make sure the image is properly invalidated
  },
};

export default nextConfig;