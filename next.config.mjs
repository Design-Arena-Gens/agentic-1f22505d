/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "agentic-1f22505d.vercel.app"]
    }
  }
};

export default nextConfig;
