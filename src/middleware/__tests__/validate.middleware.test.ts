import { describe, it, expect, vi } from 'vitest';
import { validate } from '../validate.middleware';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

describe('validate middleware', () => {
  it('should strip unexpected fields from req.body', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const middleware = validate(schema);

    const req = {
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 'malicious-role-id', // Should be stripped
        isAdmin: true, // Should be stripped
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
    });
    expect(req.body).not.toHaveProperty('roleId');
    expect(req.body).not.toHaveProperty('isAdmin');
  });

  it('should validate and reassign req.body, req.query, and req.params when using a composite schema', () => {
    const schema = z.object({
      body: z.object({
        title: z.string(),
      }),
      query: z.object({
        page: z.string().transform(Number),
      }),
      params: z.object({
        id: z.string(),
      }),
    });

    const middleware = validate(schema);

    const req = {
      body: { title: 'New Task', extra: 'field' },
      query: { page: '1', other: 'stuff' },
      params: { id: '123', secret: 'code' },
    } as unknown as Request;

    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ title: 'New Task' });
    expect(req.query).toEqual({ page: 1 });
    expect(req.params).toEqual({ id: '123' });
    
    // Check that extra fields are stripped
    expect(req.body).not.toHaveProperty('extra');
    expect(req.query).not.toHaveProperty('other');
    expect(req.params).not.toHaveProperty('secret');
  });

  it('should return 422 if validation fails', () => {
    const schema = z.object({
      name: z.string(),
    });

    const middleware = validate(schema);

    const req = {
      body: {
        // missing name
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation failed',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
