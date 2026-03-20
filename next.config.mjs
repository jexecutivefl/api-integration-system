/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless', '@prisma/adapter-neon'],
  },
};

export default nextConfig;
