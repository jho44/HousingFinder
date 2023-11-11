/** @type {import('next').NextConfig} */

const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/search',
        permanent: true,
      }
    ]
  },
  experimental: {
    optimizeCss: true, // enabling this will enable SSR for Tailwind
  },
}

module.exports = nextConfig
