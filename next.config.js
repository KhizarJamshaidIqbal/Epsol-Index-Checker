/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
    missingSuspenseWithCSRBailout: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    dirs: ['app', 'lib', 'components'],
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
}

module.exports = nextConfig
