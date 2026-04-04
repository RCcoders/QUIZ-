import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import { fail } from '../utils/response.js';

export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const zodError = result.error as ZodError;
      const message = zodError.issues
        .map((e: any) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      res.status(422).json(fail(message));
      return;
    }
    req.body = result.data;
    next();
  };
}
