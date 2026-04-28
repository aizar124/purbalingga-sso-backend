import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { MonitoringService } from '../../monitoring/monitoring.service';
import { Request } from 'express';
declare const LocalStrategy_base: new (...args: any[]) => Strategy;
export declare class LocalStrategy extends LocalStrategy_base {
    private authService;
    private monitoringService;
    constructor(authService: AuthService, monitoringService: MonitoringService);
    validate(req: Request, email: string, password: string): Promise<import("../../users/users.entity").User>;
}
export {};
