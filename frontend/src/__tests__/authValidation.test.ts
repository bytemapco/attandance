import { describe, it, expect } from 'vitest';
import { loginSchema, resetPasswordSchema } from '../lib/validations/auth';

describe('Auth Validation Schemas', () => {
  it('should validate valid login credentials', () => {
    const result = loginSchema.safeParse({
      email: 'teacher@yopmail.com',
      password: 'StrongPassword123',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'StrongPassword123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('valid email');
    }
  });

  it('should reject short passwords', () => {
    const result = loginSchema.safeParse({
      email: 'student@yopmail.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 8 characters');
    }
  });

  it('should reject mismatched reset passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Password@123',
      confirmPassword: 'Password@999',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Passwords do not match');
    }
  });
});
