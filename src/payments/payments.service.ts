import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private stripe: any | null = null;

  constructor(private prisma: PrismaService) {}

  private getStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      throw new BadRequestException('STRIPE_SECRET_KEY is not configured');
    }

    if (!this.stripe) {
      const StripeConstructor = require('stripe');
      this.stripe = new StripeConstructor(secretKey, {
        apiVersion: '2024-06-20',
      });
    }

    return this.stripe;
  }

  async createCheckoutSession(body: { appointmentId: string; amount: number }) {
    const stripe = this.getStripeClient();

    if (!body?.appointmentId || !body?.amount || body.amount <= 0) {
      throw new BadRequestException('appointmentId and positive amount are required');
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: body.appointmentId },
      select: { id: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Service Booking' },
            unit_amount: Math.round(body.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/booking`,
      metadata: { appointmentId: body.appointmentId },
    });

    // Update appointment with payment intent
    await this.prisma.appointment.update({
      where: { id: body.appointmentId },
      data: { paymentStatus: 'pending' },
    });

    return { url: session.url };
  }
}