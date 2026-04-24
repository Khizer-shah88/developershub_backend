import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(data: any) {
    const appointment = await this.prisma.appointment.create({ data });
    this.notificationsGateway.sendNewAppointment(appointment);
    return appointment;
  }

  findAll(role?: string, userId?: string) {
    const where = role === 'ADMIN' ? {} : { userId };

    return this.prisma.appointment.findMany({
      where,
      include: { Service: true, User: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateStatus(id: string, status: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: { status },
    });
  }
}