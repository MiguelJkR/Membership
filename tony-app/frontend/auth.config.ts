import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true, // localhost dev + ngrok/Cloudflare Tunnel prod
  pages: { signIn: "/login", error: "/login" }, // route auth errors to /login (avoid broken default error page)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      // All other pages require auth
      if (!isLoggedIn) return false; // redirects to /login

      // Role-based path permissions (lazy import — auth.config runs in middleware
      // which can't import server-only modules, but pure JS like users.ts is fine)
      const role = (auth?.user as any)?.role || "admin";
      const path = nextUrl.pathname;

      // Inline minimal permission check to avoid import overhead in middleware
      const TRADER_BLOCKED = ["/settings", "/security", "/vault"];
      const VIEWER_BLOCKED = [
        "/settings", "/security", "/vault",
        "/agents", "/automation", "/email", "/social-manager", "/social",
      ];

      if (role === "trader") {
        for (const b of TRADER_BLOCKED) {
          if (path === b || path.startsWith(b + "/")) {
            return Response.redirect(new URL("/?denied=trader", nextUrl));
          }
        }
      }
      if (role === "viewer") {
        for (const b of VIEWER_BLOCKED) {
          if (path === b || path.startsWith(b + "/")) {
            return Response.redirect(new URL("/?denied=viewer", nextUrl));
          }
        }
      }
      return true;
    },
  },
  providers: [], // Filled in auth.ts (separate file because middleware can't import bcrypt)
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 }, // 7 days
};
