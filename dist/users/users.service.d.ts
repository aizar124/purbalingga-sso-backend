import { Repository } from 'typeorm';
import { User, UserRole } from './users.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersService {
    private usersRepo;
    constructor(usersRepo: Repository<User>);
    findById(id: string): Promise<User | null>;
    private stripSensitive;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findByVerifyToken(token: string): Promise<User | null>;
    create(data: {
        email: string;
        password: string;
        name?: string;
        username?: string;
        role?: UserRole;
    }): Promise<User>;
    verifyEmail(token: string): Promise<User>;
    updateMfaSecret(userId: string, secret: string): Promise<void>;
    disableMfa(userId: string): Promise<void>;
    updatePassword(userId: string, newPassword: string): Promise<void>;
    setResetToken(userId: string, token: string): Promise<void>;
    findByResetToken(token: string): Promise<User | null>;
    getProfile(userId: string): Promise<Partial<User>>;
    findManySafe(limit?: number, skip?: number): Promise<any[]>;
    countUsers(): Promise<number>;
    updateProfile(userId: string, data: UpdateProfileDto): Promise<User>;
}
