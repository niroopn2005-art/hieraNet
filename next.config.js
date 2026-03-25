/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_ETHEREUM_NODE_URL: process.env.NEXT_PUBLIC_ETHEREUM_NODE_URL,
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_MULTICHAIN_PORT: process.env.NEXT_PUBLIC_MULTICHAIN_PORT,
    NEXT_PUBLIC_MULTICHAIN_HOST: process.env.NEXT_PUBLIC_MULTICHAIN_HOST,
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  productionBrowserSourceMaps: false,
  outputFileTracingRoot: __dirname,
  webpack: (config, { isServer, dev }) => {
    // Disable source maps in development to avoid issues
    if (dev) {
      config.devtool = false;
    }
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        module: false,
      };
    }
    
    // Normalize path separators for Windows compatibility
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, '.'),
    };
    
    return config;
  },
}

module.exports = nextConfig
