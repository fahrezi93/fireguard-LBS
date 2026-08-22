/** @type {import('next').NextConfig} */

const nextConfig = {
  // serverActions was removed as a top-level key in Next 15
  experimental: {
    cpus: 1,
    serverActions: {
      allowedOrigins: [
        'fireguard-palembang.my.id',
        'siagabencana.cloud',
        'localhost:3000',
        '146.190.84.205'
      ],
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Compress output CSS/JS bundles
  compress: true,
  images: {
    // Prefer AVIF then WebP for better compression
    formats: ['image/avif', 'image/webp'],
    qualities: [60, 75, 85],
    // Cache optimized images for 1 year
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    localPatterns: [
      {
        pathname: '/uploads/**',
      },
      {
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Next.js hashed static assets — safe to cache for 1 year (immutable)
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Public images & fonts — cache for 1 year
        source: '/(.*\\.webp|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.woff2|.*\\.woff)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com; connect-src 'self' https: wss: https://cloudflareinsights.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)'
          }
        ]
      }
    ];
  },
};

module.exports = nextConfig;
