import type { NextFunction, Request, Response } from 'express';
import type { ZodObject, ZodSchema, ZodTypeAny } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if the schema is a ZodObject with keys like body, query, or params
    const isObjectSchema = schema && 'shape' in schema;
    const shape = isObjectSchema ? (schema as ZodObject<Record<string, ZodTypeAny>>).shape : null;
    const hasRequestKeys = shape && ('body' in shape || 'query' in shape || 'params' in shape);

    if (hasRequestKeys) {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        res.status(422).json({
          error: 'Validation failed',
          details: result.error.flatten(),
        });
        return;
      }

      // Reassign only the fields that were validated
      const data = result.data;
      if (shape && 'body' in shape) req.body = data.body;
      if (shape && 'query' in shape) req.query = data.query;
      if (shape && 'params' in shape) req.params = data.params;
    } else {
      // Fallback: treat the entire schema as a body schema
      const result = schema.safeParse(req.body);

      if (!result.success) {
        res.status(422).json({
          error: 'Validation failed',
          details: result.error.flatten(),
        });
        return;
      }

      // Replace req.body with the sanitized/parsed data
      req.body = result.data;
    }

    next();
  };
}
