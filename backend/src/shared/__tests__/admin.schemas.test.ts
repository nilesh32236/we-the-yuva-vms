import { describe, expect, it } from 'vitest';

import { AdminCreateUserSchema, AdminUserUpdateSchema } from '../schemas/admin.schemas';

describe('admin.schemas', () => {
  describe('AdminCreateUserSchema', () => {
    it('should accept valid create user input', () => {
      const result = AdminCreateUserSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        role: 'VOLUNTEER',
      });
      expect(result.success).toBe(true);
    });

    it('should accept create user with locationName', () => {
      const result = AdminCreateUserSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        role: 'COORDINATOR',
        locationName: 'Mumbai',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
      const result = AdminCreateUserSchema.safeParse({
        name: 'A',
        email: 'test@example.com',
        role: 'VOLUNTEER',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = AdminCreateUserSchema.safeParse({
        name: 'Test',
        email: 'not-email',
        role: 'VOLUNTEER',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
      const result = AdminCreateUserSchema.safeParse({
        name: 'Test',
        email: 'test@example.com',
        role: 'INVALID',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('AdminUserUpdateSchema', () => {
    it('should accept valid status update', () => {
      const result = AdminUserUpdateSchema.safeParse({ status: 'ACTIVE' });
      expect(result.success).toBe(true);
    });

    it('should accept valid role update', () => {
      const result = AdminUserUpdateSchema.safeParse({ role: 'COORDINATOR' });
      expect(result.success).toBe(true);
    });

    it('should accept both status and role', () => {
      const result = AdminUserUpdateSchema.safeParse({ status: 'SUSPENDED', role: 'ADMIN' });
      expect(result.success).toBe(true);
    });

    it('should reject when neither status nor role provided', () => {
      const result = AdminUserUpdateSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const result = AdminUserUpdateSchema.safeParse({ status: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
      const result = AdminUserUpdateSchema.safeParse({ role: 'INVALID' });
      expect(result.success).toBe(false);
    });
  });
});
