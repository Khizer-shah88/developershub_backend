import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.portfolio.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(data: any) {
    return this.prisma.portfolio.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.portfolio.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.portfolio.delete({ where: { id } });
  }
}