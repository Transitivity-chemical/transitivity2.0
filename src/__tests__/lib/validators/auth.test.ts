import { describe, it, expect } from 'vitest';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/lib/validators/auth';

describe('registerSchema', () => {
  it('accepts valid registration input', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      fullName: 'John Doe',
      password: 'securepass123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      fullName: 'John Doe',
      password: 'securepass123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short fullName (less than 2 chars)', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      fullName: 'A',
      password: 'securepass123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password (less than 8 chars)', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      fullName: 'John Doe',
      password: '1234567',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = registerSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects extra unknown fields (strict mode)', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      fullName: 'John Doe',
      password: 'securepass123',
      role: 'admin',
    });
    expect(result.success).toBe(false);
  });

  it('trims fullName whitespace', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      fullName: '  John Doe  ',
      password: 'securepass123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe('John Doe');
    }
  });
});

describe('loginSchema', () => {
  it('accepts valid login input', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'anypassword',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'bad',
      password: 'password',
    });
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email and locale', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'user@example.com',
      locale: 'en',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid locale', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'user@example.com',
      locale: 'es',
    });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts valid token and password', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'token-123',
      newPassword: 'NovaSenhaSegura123!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short password', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'token-123',
      newPassword: '123',
    });
    expect(result.success).toBe(false);
  });
});
