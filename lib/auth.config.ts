import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.emailVerified = token.emailVerified ?? null;
        session.user.image = token.picture ?? session.user.image ?? null;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
