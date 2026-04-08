import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { prisma } from './prisma';
import { authConfig } from '@/auth.config';

/**
 * Full NextAuth instance — Node-only.
 *
 * Imports the edge-safe `authConfig` and adds the Credentials provider whose
 * `authorize` function uses Prisma + bcrypt (Node-only deps).
 *
 * Reference: docs/research-external.md §1 (auth.config.ts split pattern)
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.isActive || user.deletedAt) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash,
        );

        if (!passwordMatch) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          plan: user.plan,
          mustChangePassword: user.mustChangePassword,
          pendingApproval: user.pendingApproval,
        };
      },
    }),
  ],
});
