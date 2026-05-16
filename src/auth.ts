import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Required on Vercel — the app runs behind a proxy and Auth.js must trust
  // the forwarded host header to construct correct callback URLs.
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  // JWT strategy: sessions are stored in a signed cookie, not the database.
  // This eliminates the DB write on every login, fixing cold-start timeouts
  // that caused the "multiple attempts to sign in" problem on Vercel.
  session: { strategy: "jwt" },
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
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      if (!isLoggedIn) {
        const signInUrl = new URL("/sign-in", nextUrl.origin);
        signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(signInUrl);
      }
      return true;
    },
    jwt({ token, user }) {
      // Persist the user's DB id into the JWT on first sign-in
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
