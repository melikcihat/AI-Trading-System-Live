import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare class ApiKeyController {
    static getApiKeys(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static addApiKey(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static deleteApiKey(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=apiKeyController.d.ts.map