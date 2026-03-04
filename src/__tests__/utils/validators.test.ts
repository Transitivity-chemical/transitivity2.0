import { describe, it, expect } from 'vitest';

// Simple validation utilities for testing
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/<[^>]*>/g, '');
}

describe('isValidEmail', () => {
  it('accepts a valid email address', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('rejects email without @ symbol', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('rejects email without domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects email with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('accepts passwords with 8 or more characters', () => {
    expect(isValidPassword('abcdefgh')).toBe(true);
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(isValidPassword('abc')).toBe(false);
  });

  it('rejects empty password', () => {
    expect(isValidPassword('')).toBe(false);
  });
});

describe('isStrongPassword', () => {
  it('accepts password with uppercase, lowercase, and digit', () => {
    expect(isStrongPassword('Abcdefg1')).toBe(true);
  });

  it('rejects password without uppercase', () => {
    expect(isStrongPassword('abcdefg1')).toBe(false);
  });

  it('rejects password without digit', () => {
    expect(isStrongPassword('Abcdefgh')).toBe(false);
  });
});

describe('sanitizeInput', () => {
  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('strips HTML tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('handles empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('preserves normal text', () => {
    expect(sanitizeInput('Hello World')).toBe('Hello World');
  });
});
