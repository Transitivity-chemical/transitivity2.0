import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe NextAuth config.
 *
 * NO Prisma imports, NO bcrypt imports, NO Node-only crypto.
 * This config is consumed by `proxy.ts` (formerly middleware) which runs at the edge.
 *
 * The full Credentials provider with `authorize` lives in `lib/auth.ts` which IS Node-only.
 *
 * Reference: docs/research-external.md §1 (NextAuth v5 RBAC pattern)
 */
export const authConfig = {
  pages: {
    signIn: '/pt-BR/login',
  },
  session: { strategy: 'jwt' },
  providers: [], // populated in lib/auth.ts (Node-only)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id?: string;
          role?: string;
          plan?: string | null;
          mustChangePassword?: boolean;
          pendingApproval?: boolean;
        };
        token.userId = u.id ?? token.userId;
        token.role = u.role ?? token.role;
        token.plan = u.plan ?? null;
        token.mustChangePassword = Boolean(u.mustChangePassword);
        token.pendingApproval = Boolean(u.pendingApproval);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const t = token as {
          userId?: string;
          role?: string;
          plan?: string | null;
          mustChangePassword?: boolean;
          pendingApproval?: boolean;
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = session.user as any;
        u.id = t.userId;
        u.role = t.role;
        u.plan = t.plan ?? null;
        u.mustChangePassword = Boolean(t.mustChangePassword);
        u.pendingApproval = Boolean(t.pendingApproval);
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      // Strip locale prefix for path checks
      const stripped = nextUrl.pathname.replace(/^\/(pt-BR|en)/, '') || '/';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (auth?.user as any) ?? null;
      const isLoggedIn = Boolean(user);

      // Public paths
      if (
        stripped === '/' ||
        stripped.startsWith('/login') ||
        stripped.startsWith('/register') ||
        stripped.startsWith('/forgot-password') ||
        stripped.startsWith('/reset-password') ||
        stripped.startsWith('/course') ||
        stripped.startsWith('/api/auth') ||
        stripped.startsWith('/pending-approval') ||
        stripped.startsWith('/change-password')
      ) {
        return true;
      }

      if (!isLoggedIn) return false;

      // Pending approval users can only see /pending-approval and /change-password
      if (user.pendingApproval) {
        return stripped.startsWith('/pending-approval');
      }

      // Force password change before anything else
      if (user.mustChangePassword) {
        return stripped.startsWith('/change-password');
      }

      // Admin-only paths
      if (stripped.startsWith('/admin')) {
        return user.role === 'ADMIN';
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
