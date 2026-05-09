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
      return true;
    },
  },
  providers: [], // Filled in auth.ts (separate file because middleware can't import bcrypt)
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 }, // 7 days
};
