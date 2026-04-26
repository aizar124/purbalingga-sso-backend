import { Body, Controller, Get, Patch, Put, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req,
    @Body() body: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async patchProfile(
    @Request() req,
    @Body() body: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, body);
  }
}
