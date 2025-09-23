export interface ApiKey {
    id: number;
    user_id: number;
    exchange: string;
    api_key_encrypted: string;
    api_secret_encrypted: string;
    created_at: Date;
    updated_at: Date;
}
export declare class ApiKeyModel {
    static create(userId: number, exchange: string, apiKeyEncrypted: string, apiSecretEncrypted: string): Promise<ApiKey>;
    static findByUserId(userId: number): Promise<ApiKey[]>;
    static delete(id: number, userId: number): Promise<boolean>;
}
//# sourceMappingURL=apiKey.d.ts.map