import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() body: any) {
    return this.appointmentsService.create(body);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CLIENT')
  findAll(@Req() req: any) {
    const role = req?.user?.role as string;
    const userId = (req?.user?.sub ?? req?.user?.id) as string | undefined;
    return this.appointmentsService.findAll(role, userId);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.appointmentsService.updateStatus(id, status);
  }
}