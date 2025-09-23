import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare class UserController {
    static getProfile(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static updateProfile(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=userController.d.ts.map