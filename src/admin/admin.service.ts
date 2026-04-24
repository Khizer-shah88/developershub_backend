import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AdminRole = 'ADMIN' | 'CLIENT';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [users, services, portfolio, blogPosts, inquiries, appointments] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.service.count(),
        this.prisma.portfolio.count(),
        this.prisma.blogPost.count(),
        this.prisma.inquiry.count(),
        this.prisma.appointment.count(),
      ]);

    const [recentInquiries, recentAppointments] = await Promise.all([
      this.prisma.inquiry.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { Service: true, User: true },
      }),
      this.prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { Service: true, User: true },
      }),
    ]);

    return {
      stats: {
        users,
        services,
        portfolio,
        blogPosts,
        inquiries,
        appointments,
      },
      recentInquiries,
      recentAppointments,
    };
  }

  listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserRole(userId: string, role: string, actorId?: string) {
    const normalizedRole = role?.toUpperCase();
    if (normalizedRole !== 'ADMIN' && normalizedRole !== 'CLIENT') {
      throw new BadRequestException('role must be ADMIN or CLIENT');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === normalizedRole) {
      return user;
    }

    if (user.role === 'ADMIN' && normalizedRole === 'CLIENT') {
      if (actorId && actorId === user.id) {
        throw new BadRequestException('You cannot demote your own admin account');
      }

      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot demote the last admin user');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: normalizedRole as AdminRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async removeUser(userId: string, actorId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (actorId && actorId === user.id) {
      throw new BadRequestException('You cannot remove your own account');
    }

    if (user.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin user');
      }
    }

    await this.prisma.$transaction([
      this.prisma.inquiry.updateMany({
        where: { userId: user.id },
        data: { userId: null },
      }),
      this.prisma.appointment.updateMany({
        where: { userId: user.id },
        data: { userId: null },
      }),
      this.prisma.user.delete({ where: { id: user.id } }),
    ]);

    return user;
  }
}
