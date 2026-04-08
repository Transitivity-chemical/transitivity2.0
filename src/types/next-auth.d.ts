import type { DefaultSession } from 'next-auth';
import type { Plan, UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      plan: Plan | null;
      mustChangePassword: boolean;
      pendingApproval: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: UserRole;
    plan?: Plan | null;
    mustChangePassword?: boolean;
    pendingApproval?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    role: UserRole;
    plan: Plan | null;
    mustChangePassword: boolean;
    pendingApproval: boolean;
  }
}
