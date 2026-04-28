export declare class ValidateTokenDto {
    token: string;
}
export declare class ActivityDto {
    action: string;
    path?: string;
    page?: string;
    title?: string;
    clientId?: string;
    metadata?: Record<string, any>;
}
export declare class LastActiveDto {
    clientId?: string;
    metadata?: Record<string, any>;
}
export declare class DateRangeDto {
    date?: string;
    limit?: number;
}
export declare class UserListQueryDto {
    limit?: number;
    page?: number;
}
