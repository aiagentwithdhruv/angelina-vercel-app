/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['storage.googleapis.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['grammy', '@grammyjs/auto-retry'],
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
