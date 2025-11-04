/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['r2.cloudflarestorage.com', 'pub-*.r2.dev'],
  },
}

module.exports = nextConfig
