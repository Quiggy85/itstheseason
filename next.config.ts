import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cc-west-usa.oss-us-west-1.aliyuncs.com",
      },
      {
        protocol: "https",
        hostname: "cf.cjdropshipping.com",
      },
      {
        protocol: "https",
        hostname: "img.cjdropshipping.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
