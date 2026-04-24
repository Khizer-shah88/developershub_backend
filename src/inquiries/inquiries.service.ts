import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class InquiriesService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(data: any) {
    const payload = {
      ...data,
      name: typeof data?.name === 'string' ? data.name.trim() : '',
      email: typeof data?.email === 'string' ? data.email.trim() : '',
      message: typeof data?.message === 'string' ? data.message.trim() : '',
      phone: typeof data?.phone === 'string' ? data.phone.trim() : data?.phone,
    };

    if (!payload.name || !payload.email || !payload.message) {
      throw new BadRequestException('Name, email and message are required.');
    }

    if (payload.serviceId) {
      const serviceExists = await this.prisma.service.findUnique({
        where: { id: payload.serviceId },
        select: { id: true },
      });
      if (!serviceExists) {
        delete payload.serviceId;
      }
    }

    if (payload.userId) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true },
      });
      if (!userExists) {
        delete payload.userId;
      }
    }

    const inquiry = await this.prisma.inquiry.create({ data: payload });
    // Real-time notification
    const gateway = this.notificationsGateway as unknown as {
      sendNewInquiry?: (inquiry: any) => void;
    };
    gateway.sendNewInquiry?.(inquiry);
    return inquiry;
  }

  findAll(role?: string, userId?: string) {
    const where = role === 'ADMIN' ? {} : { userId };

    return this.prisma.inquiry.findMany({
      where,
      include: { Service: true, User: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateStatus(id: string, status: string) {
    return this.prisma.inquiry.update({
      where: { id },
      data: { status },
    });
  }
}