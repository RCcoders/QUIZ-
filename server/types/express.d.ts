import 'express';

declare global {
    namespace Express {
        interface Request {
            user?: {
                _id: string;
                role: string;
                email?: string;
                displayName?: string;
            };
        }
    }
}
