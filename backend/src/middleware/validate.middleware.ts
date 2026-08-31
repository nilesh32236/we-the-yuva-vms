import type { NextFunction, Request, Response } from 'express';
import type { ZodObject, ZodSchema, ZodTypeAny } from 'zod';

function findExtraKeys(original: unknown, parsed: unknown): string[] {
  if (!original || typeof original !== 'object' || !parsed || typeof parsed !== 'object') return [];
  const origKeys = Object.keys(original as Record<string, unknown>);
  const parsedKeys = new Set(Object.keys(parsed as Record<string, unknown>));
  return origKeys.filter((k) => !parsedKeys.has(k));
}

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if the schema is a ZodObject with keys like body, query, or params
    const isObjectSchema = schema && 'shape' in schema;
    const shape = isObjectSchema ? (schema as ZodObject<Record<string, ZodTypeAny>>).shape : null;
    const hasRequestKeys = shape && ('body' in shape || 'query' in shape || 'params' in shape);

    if (hasRequestKeys) {
      const input = {
        body: req.body,
        query: req.query,
        params: req.params,
      };
      const result = schema.safeParse(input);

      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        res.status(422).json({ errors: fieldErrors });
        return;
      }

      // Reject unknown top-level keys that were stripped by ZodObject's default strip behavior
      const data = result.data as Record<string, unknown>;
      const extraErrors: Record<string, string[]> = {};
      for (const key of ['body', 'query', 'params'] as const) {
        if (shape && key in shape) {
          const extra = findExtraKeys(
            (input as Record<string, unknown>)[key],
            (data as Record<string, unknown>)[key]
          );
          if (extra.length > 0) {
            extraErrors[key] = [`Unknown fields: ${extra.join(', ')}`];
          }
        }
      }
      if (Object.keys(extraErrors).length > 0) {
        res.status(422).json({ errors: extraErrors });
        return;
      }

      // Reassign only the fields that were validated
      if (shape && 'body' in shape) req.body = (data as { body: unknown }).body as never;
      if (shape && 'query' in shape) req.query = (data as { query: unknown }).query as never;
      if (shape && 'params' in shape) req.params = (data as { params: unknown }).params as never;
    } else {
      // Fallback: treat the entire schema as a body schema
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        res.status(422).json({ errors: fieldErrors });
        return;
      }

      // Detect stripped unknown keys for plain body schemas (ZodObject strip)
      const extra = findExtraKeys(req.body, result.data);
      if (extra.length > 0) {
        res.status(422).json({ errors: { _unknown: [`Unknown fields: ${extra.join(', ')}`] } });
        return;
      }

      // Replace req.body with the sanitized/parsed data
      req.body = result.data;
    }

    next();
  };
}
