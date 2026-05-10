import type { NextConfig } from "next";

/**
 * Tony AI — Next.js config
 *
 * Reverse-proxy `/api/*` to Flask backend so client always uses same-origin URLs.
 *
 * IMPORTANT: we use `fallback` (not `afterFiles` array) so the proxy ONLY runs
 * if NO Next.js route matched. NextAuth lives at `app/api/auth/[...nextauth]/route.ts`
 * (a dynamic catch-all route) — `fallback` rewrites run after dynamic routes,
 * letting NextAuth handle `/api/auth/*` first.
 */
const FLASK_URL = process.env.FLASK_BACKEND_URL || "http://127.0.0.1:8765";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      // fallback runs AFTER everything (filesystem + dynamic routes + i18n) didn't match
      fallback: [
        { source: "/api/:path*", destination: `${FLASK_URL}/api/:path*` },
      ],
    };
  },
};

export default nextConfig;
