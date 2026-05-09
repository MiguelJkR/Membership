import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

const TONY_USERNAME = process.env.TONY_USERNAME || "miguel";
const TONY_PASSWORD = process.env.TONY_PASSWORD || "tony-ai-2026";

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const { username, password } = credentials as { username: string; password: string };
        if (username === TONY_USERNAME && password === TONY_PASSWORD) {
          return { id: "miguel", name: "Miguel A Balart Batlle", email: "contact@maclorianxgroup.com" };
        }
        return null;
      },
    }),
  ],
});
