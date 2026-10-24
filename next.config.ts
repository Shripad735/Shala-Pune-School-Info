import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The CSV sources are read with node:fs at request time, so make sure the
  // bundler leaves them alone and includes them in the server output.
  outputFileTracingIncludes: {
    "/**": ["./data/**/*"],
  },
};

export default nextConfig;
