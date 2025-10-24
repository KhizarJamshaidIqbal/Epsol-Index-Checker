/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    dirs: ['app', 'lib', 'components'],
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
