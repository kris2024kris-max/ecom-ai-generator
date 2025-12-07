import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  experimental: {
    serverExternalPackages: ['better-sqlite3'],
  },
}

export default nextConfig
