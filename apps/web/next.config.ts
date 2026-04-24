import type { NextConfig } from 'next';

const isExport = process.env.NEXT_OUTPUT === 'export';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Editor is a client-side SPA; static export for simple nginx deploy.
  ...(isExport ? { output: 'export', images: { unoptimized: true } } : {}),
  transpilePackages: [
    '@photo-magic/ui',
    '@photo-magic/editor-engine',
    '@photo-magic/shared-types',
  ],
  experimental: {
    optimizePackageImports: ['@photo-magic/ui', 'konva'],
  },
  async headers() {
    if (isExport) return [];
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
