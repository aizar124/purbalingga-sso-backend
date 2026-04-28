export declare enum MonitoringEventType {
    REGISTER_SUCCESS = "register_success",
    LOGIN_SUCCESS = "login_success",
    LOGIN_FAILED = "login_failed",
    TOKEN_VALIDATE = "token_validate",
    ACTIVITY = "activity",
    LAST_ACTIVE = "last_active",
    USERS_LIST = "users_list",
    USER_DETAIL = "user_detail",
    ACTIVE_USERS_LIST = "active_users_list",
    ACTIVE_USERS_DETAIL = "active_users_detail"
}
export declare class MonitoringEvent {
    id: string;
    eventType: MonitoringEventType;
    actorUserId: string;
    subjectUserId: string;
    clientId: string;
    route: string;
    method: string;
    success: boolean;
    statusCode: number;
    ip: string;
    userAgent: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
