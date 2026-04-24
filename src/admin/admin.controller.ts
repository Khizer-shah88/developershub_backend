import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Param('id') id: string,
    @Body('role') role: string,
    @Req() req: any,
  ) {
    const actorId = req?.user?.sub ?? req?.user?.id;
    return this.adminService.updateUserRole(id, role, actorId);
  }

  @Delete('users/:id')
  removeUser(@Param('id') id: string, @Req() req: any) {
    const actorId = req?.user?.sub ?? req?.user?.id;
    return this.adminService.removeUser(id, actorId);
  }
}
