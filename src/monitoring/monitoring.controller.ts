import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { MonitoringService } from './monitoring.service';
import {
  ActivityDto,
  DateRangeDto,
  LastActiveDto,
  ValidateTokenDto,
  UserListQueryDto,
} from './dto/monitoring.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api')
export class MonitoringController {
  constructor(private monitoringService: MonitoringService) {}

  @Post('validate-token')
  @HttpCode(HttpStatus.OK)
  async validateToken(@Body() dto: ValidateTokenDto, @Req() req: Request) {
    return this.monitoringService.validateToken(dto.token, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
  }

  @Post('activity')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async activity(@Req() req: Request, @Body() dto: ActivityDto) {
    const user = req.user as any;
    await this.monitoringService.recordActivity(user.id, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    return { message: 'Activity tercatat' };
  }

  @Post('last-active')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async lastActive(@Req() req: Request, @Body() dto: LastActiveDto) {
    const user = req.user as any;
    await this.monitoringService.recordLastActive(user.id, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    return { message: 'Last active diperbarui' };
  }

  @Get('logins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async logins(@Query() query: DateRangeDto) {
    return this.monitoringService.getLoginReport(query.date, query.limit || 20);
  }

  @Get('registers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async registers(@Query() query: DateRangeDto) {
    return this.monitoringService.getRegisterReport(query.date, query.limit || 20);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async users(@Query() query: UserListQueryDto) {
    return this.monitoringService.listUsers(query.limit || 100, query.page || 1);
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async userDetail(@Param('id') id: string) {
    return this.monitoringService.getUserDetail(id);
  }

  @Get('active-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async activeUsers() {
    return this.monitoringService.listActiveUsers(false);
  }

  @Get('active-users/detail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async activeUsersDetail() {
    return this.monitoringService.listActiveUsers(true);
  }
}
