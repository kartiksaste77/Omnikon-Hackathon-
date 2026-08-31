/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Vercel / Docker
  output: "standalone",
  // Use empty turbopack config to acknowledge Turbopack is active
  turbopack: {},
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
