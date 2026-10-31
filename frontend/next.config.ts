import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.31.239", "localhost:3000", "127.0.0.1:3000"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
