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
  experimental: {
    // Sentry's server SDK pulls in OpenTelemetry + require-in-the-middle, which
    // use dynamic `require` that webpack can't statically analyze. Externalising
    // them silences the "Critical dependency" warnings without breaking runtime.
    serverComponentsExternalPackages: [
      '@sentry/nextjs',
      '@opentelemetry/instrumentation',
      'require-in-the-middle',
    ],
  },
};

// Sentry is opt-in. The package may not be installed locally yet; if so we
// fall back to the bare config so `next build` still works in environments
// that don't have it.
async function buildExportedConfig() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return nextConfig;
  try {
    const { withSentryConfig } = await import('@sentry/nextjs');
    return withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
    });
  } catch {
    return nextConfig;
  }
}

export default await buildExportedConfig();
