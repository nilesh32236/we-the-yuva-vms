import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '../validate.middleware';

describe('validate middleware', () => {
  it('should reject unexpected fields from req.body with 422', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const middleware = validate(schema);

    const req = {
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 'malicious-role-id',
        isAdmin: true,
      },
    } as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(next).not.toHaveBeenCalled();
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
      body: { title: 'New Task' },
      query: { page: '1' },
      params: { id: '123' },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ title: 'New Task' });
    expect(req.query).toEqual({ page: 1 });
    expect(req.params).toEqual({ id: '123' });
  });

  it('should reject extra fields in composite schema with 422', () => {
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

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(next).not.toHaveBeenCalled();
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
        errors: { name: ['Required'] },
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
