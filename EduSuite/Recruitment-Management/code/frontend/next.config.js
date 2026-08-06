/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
    ],
  },
  typedRoutes: true,
  experimental: {
    // Remove typedRoutes from here as it's now top-level
  },
};

export default nextConfig;