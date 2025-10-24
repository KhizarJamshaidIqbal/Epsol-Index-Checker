/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    dirs: ['app', 'lib', 'components'],
  },
}

module.exports = nextConfig
