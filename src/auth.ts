import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    // This is what makes the middleware actually redirect unauthenticated users.
    // Without it, `auth as middleware` is a no-op — it adds session context but
    // never blocks or redirects anyone.
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      if (!isLoggedIn) {
        const signInUrl = new URL("/sign-in", nextUrl.origin);
        signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(signInUrl);
      }
      return true;
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
