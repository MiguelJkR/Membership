import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    // All routes except: api, static files, _next, manifest, sw, public images
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|tony-character.*\\.png).*)",
  ],
};
