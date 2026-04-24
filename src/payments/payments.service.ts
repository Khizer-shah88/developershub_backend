import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  async createCheckoutSession(body: { appointmentId: string; amount: number }) {
    void body;
    throw new BadRequestException('Payments are temporarily disabled');
  }
}