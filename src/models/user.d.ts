export interface User {
    id: number;
    email: string;
    password_hash: string;
    created_at: Date;
    updated_at: Date;
}
export declare class UserModel {
    static create(email: string, passwordHash: string): Promise<User>;
    static findByEmail(email: string): Promise<User | null>;
    static findById(id: number): Promise<User | null>;
}
//# sourceMappingURL=user.d.ts.map