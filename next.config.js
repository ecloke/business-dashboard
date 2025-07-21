/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Next.js 13+ uses Pages Router by default when pages/ directory exists
  typescript: {
    // Type checking is handled by scripts, allow builds to continue with type errors for faster development
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint checking is handled by scripts
    ignoreDuringBuilds: false,
  },
  // Optimize for Netlify deployment
  output: 'standalone',
  // Handle trailing slashes for consistent routing
  trailingSlash: false,
  // Enable image optimization for better performance
  images: {
    domains: ['localhost'],
    unoptimized: true, // Required for static exports
  },
  // Environment variable configuration
  env: {
    CUSTOM_KEY: 'business-dashboard',
  },
}

module.exports = nextConfig