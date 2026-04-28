export declare enum UserRole {
    USER = "user",
    ADMIN = "admin",
    SUPERADMIN = "superadmin"
}
export declare enum UserGender {
    MALE = "male",
    FEMALE = "female",
    OTHER = "other"
}
export declare class User {
    id: string;
    email: string;
    username: string;
    password: string;
    name: string;
    avatarUrl: string;
    birthDate: string;
    phone: string;
    city: string;
    bio: string;
    gender: UserGender;
    role: UserRole;
    isVerified: boolean;
    verifyToken: string;
    verifyTokenExpiry: Date;
    mfaSecret: string;
    mfaEnabled: boolean;
    resetToken: string;
    resetTokenExpiry: Date;
    createdAt: Date;
    updatedAt: Date;
}
