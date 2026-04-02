import type { Response, NextFunction } from 'express';
export declare const protect: (req: any, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: string[]) => (req: any, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=authMiddleware.d.ts.map