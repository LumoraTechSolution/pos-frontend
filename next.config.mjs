/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Security headers (CSP with per-request nonce, X-Frame-Options, etc.) are
  // applied in middleware.ts so they can carry a fresh nonce on every request.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};

export default nextConfig;
