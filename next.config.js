/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['undici'],
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || ""
  },
  // Remove or only include if needed
  // experimental: {
  //   appDir: true
  // },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias['undici'] = false;
    }
    
    return config;
  },
  // Suppress hydration warnings for browser extension attributes
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Suppress specific hydration warnings
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;