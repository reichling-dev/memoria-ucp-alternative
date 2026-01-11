import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'logos-world.net',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
    ],
  },
  // Updated for Next.js 16 - moved from experimental
  serverExternalPackages: ['discord.js', 'zlib-sync', 'bufferutil', 'utf-8-validate'],
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig

