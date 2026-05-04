import { Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { SessionsService } from '../../sessions/sessions.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private usersService;
    private sessionsService;
    constructor(usersService: UsersService, sessionsService: SessionsService);
    validate(payload: any): Promise<{
        id: any;
        email: any;
        role: any;
        scopes: any;
        clientId: any;
        sessionId: any;
    }>;
}
export {};
