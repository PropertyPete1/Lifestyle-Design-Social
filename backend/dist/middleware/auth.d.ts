import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                userId: string;
                email?: string;
                iat?: number;
                exp?: number;
            };
        }
    }
}
export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        userId: string;
        email?: string;
        iat?: number;
        exp?: number;
    };
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map