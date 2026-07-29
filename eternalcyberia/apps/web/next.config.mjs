/** @type {import("next").NextConfig} */
export default {
  reactStrictMode: true,
  transpilePackages: ["@ec/ui", "@ec/tokens", "@ec/studio-sdk", "@ec/crdt", "@ec/schema"],
  experimental: { optimizePackageImports: ["@ec/ui"] },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'wasm-unsafe-eval'",
            "connect-src 'self' https://api.eternalcyberia.dev wss://rt.eternalcyberia.dev",
            "img-src 'self' data: blob: https://assets.eternalcyberia.dev",
            "frame-src https://sandbox.eternalcyberia.dev",   // user code, separate origin
            "object-src 'none'", "base-uri 'none'",
          ].join("; ") },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    }];
  },
};
