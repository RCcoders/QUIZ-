import type { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        role: string;
        email?: string;
        displayName?: string;
    };
}
export declare const getDashboardStats: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=teacherDashboardController.d.ts.map