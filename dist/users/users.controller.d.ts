import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<Partial<import("./users.entity").User>>;
    updateProfile(req: any, body: UpdateProfileDto): Promise<import("./users.entity").User>;
    patchProfile(req: any, body: UpdateProfileDto): Promise<import("./users.entity").User>;
}
