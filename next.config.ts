import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The school data is embedded at build time by scripts/generate-data.mjs, so
  // the server does not touch the filesystem at runtime. That keeps the app
  // deployable to Cloudflare (Workers/Pages) and any Edge runtime.
};

export default nextConfig;
