const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
const FINGERPRINTING_HEADERS = ['server', 'x-powered-by'];

export function buildContentSecurityPolicy(isDev: boolean) {
  return [
    "default-src 'self'",

    // ⚠️ Keep unsafe-inline for Next.js unless you move to nonces
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,

    "style-src 'self' 'unsafe-inline'",

    // Allow images from trusted + blobs (Next.js)
    "img-src 'self' data: https: blob:",

    // Google fonts support
    "font-src 'self' https://fonts.gstatic.com data:",

    // Same-origin API routes + websockets in dev
    `connect-src 'self'${
      isDev ? ' ws: wss:' : ''
    }`,

    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",

    // Prevent embedding (clickjacking protection)
    "frame-ancestors 'none'",

    // Upgrade HTTP → HTTPS in production
    isDev ? '' : 'upgrade-insecure-requests',
  ]
    .filter(Boolean)
    .join('; ');
}

export function getSecurityHeaders(isDev: boolean) {
  const headers = [
    // 🔒 CORS (restricted)
    {
      key: 'Access-Control-Allow-Origin',
      value: 'https://nibifb.nibbank.com.et',
    },
    {
      key: 'Access-Control-Allow-Credentials',
      value: 'false',
    },
    {
      key: 'Access-Control-Allow-Methods',
      value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    },
    {
      key: 'Access-Control-Allow-Headers',
      value: 'Content-Type, Authorization',
    },

    // 🔒 Core Security Headers
    {
      key: 'Content-Security-Policy',
      value: buildContentSecurityPolicy(isDev),
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },

    // 🔒 Permissions (fully restricted)
    {
      key: 'Permissions-Policy',
      value:
        'geolocation=(), camera=(), microphone=(), accelerometer=(), gyroscope=(), magnetometer=()',
    },

    // 🔒 Cross-Origin Isolation (modern protection)
    {
      key: 'Cross-Origin-Opener-Policy',
      value: 'same-origin',
    },
    {
      key: 'Cross-Origin-Resource-Policy',
      value: 'same-origin',
    },

    // Optional: enable only if no cross-origin embeds are needed
    // {
    //   key: 'Cross-Origin-Embedder-Policy',
    //   value: 'require-corp',
    // },

    // 🔒 Misc hardening
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'off',
    },
  ];

  // 🔒 HSTS (production only)
  if (!isDev) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: `max-age=${ONE_YEAR_IN_SECONDS}; includeSubDomains; preload`,
    });
  }

  return headers;
}

export function stripFingerprintingHeaders(target: Headers) {
  for (const header of FINGERPRINTING_HEADERS) {
    target.delete(header);
  }
}

// 🔒 Helper to apply headers (e.g., in middleware or API routes)
export function applySecurityHeaders(target: Headers, isDev: boolean) {
  stripFingerprintingHeaders(target);

  for (const header of getSecurityHeaders(isDev)) {
    target.set(header.key, header.value);
  }
}