import { describe, expect, it, vi } from 'vitest';
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetExpired,
} from '@/lib/password-reset';

describe('password reset helpers', () => {
  it('creates a token, hash, and future expiry', () => {
    const before = Date.now();
    const result = createPasswordResetToken();

    expect(result.token).toMatch(/^[a-f0-9]{64}$/);
    expect(result.tokenHash).toBe(hashPasswordResetToken(result.token));
    expect(result.expiresAt.getTime()).toBeGreaterThan(before);
  });

  it('hashes equal tokens to the same value', () => {
    expect(hashPasswordResetToken('abc123')).toBe(hashPasswordResetToken('abc123'));
  });

  it('detects expired and valid timestamps', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));

    expect(isPasswordResetExpired(new Date('2026-04-10T11:59:59Z'))).toBe(true);
    expect(isPasswordResetExpired(new Date('2026-04-10T12:30:00Z'))).toBe(false);
    expect(isPasswordResetExpired(null)).toBe(true);

    vi.useRealTimers();
  });
});
