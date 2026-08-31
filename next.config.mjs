/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
