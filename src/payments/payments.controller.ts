import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create-checkout')
  createCheckout(@Body() body: { appointmentId: string; amount: number }) {
    return this.paymentsService.createCheckoutSession(body);
  }
}