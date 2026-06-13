import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }: { token: any; user?: any; trigger?: string }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username ?? null;
        token.emailVerified = (user as any).emailVerified ?? null;
        token.picture = (user as any).image ?? token.picture ?? null;
      }
      if (token.id && (trigger === "update" || token.username === undefined || !token.emailVerified)) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { username: true, emailVerified: true, image: true },
        });
        if (dbUser) {
          token.username = dbUser.username;
          token.emailVerified = dbUser.emailVerified;
          token.picture = dbUser.image ?? token.picture ?? null;
        }
      }
      return token;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        // Accounts store lowercased emails; normalize the input so casing or a
        // stray space (mobile autocapitalize/autofill) can't fail the lookup.
        const email = String(credentials.email).trim().toLowerCase();
        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash) return null;
        if (user.bannedAt) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          username: user.username,
        };
      },
    }),
    ...(process.env.AUTH_GOOGLE_ID ? [Google] : []),
    ...(process.env.AUTH_GITHUB_ID ? [GitHub] : []),
  ],
});
