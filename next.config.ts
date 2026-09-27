import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // رفع صور الأخبار (الحد الافتراضي 1 ميجابايت فقط)
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
