import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Static security headers. The per-request CSP (with nonce) is set in middleware.ts.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' }
        ]
      }
    ]
  }
}

export default nextConfig
