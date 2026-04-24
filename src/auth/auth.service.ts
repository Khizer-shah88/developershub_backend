import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

const nodemailer = require('nodemailer');

@Injectable()
export class AuthService {   
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(name: string, email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    try {
      user = await this.prisma.user.create({
        data: { name, email, password: hashedPassword, role: 'CLIENT' },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }

      throw error;
    }

    return this.login(user.email, password);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async setupAdmin(name: string, email: string, password: string) {
    const existingAdmin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    if (existingAdmin) {
      throw new BadRequestException('Admin already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      return await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }

      throw error;
    }
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    const genericResponse = {
      message:
        'If an account exists for this email, a password reset link has been sent.',
    };

    if (!user) {
      return genericResponse;
    }

    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpPort = Number(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').trim();
    const mailFrom = (process.env.MAIL_FROM || smtpUser)?.trim();

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !mailFrom) {
      throw new BadRequestException('Password reset email is not configured on server');
    }

    const resetToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'password_reset',
      },
      { expiresIn: '15m' },
    );

    const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;

    const isGmail = smtpHost === 'smtp.gmail.com';

    const transporter = isGmail
      ? nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        })
      : nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

    try {
      await transporter.sendMail({
        from: mailFrom,
        to: user.email,
        subject: 'DevelopersHub password reset',
        text: `Reset your password using this link (valid for 15 minutes): ${resetUrl}`,
        html: `
          <p>You requested a password reset for DevelopersHub.</p>
          <p>This link is valid for <strong>15 minutes</strong>.</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>If you did not request this, you can ignore this email.</p>
        `,
      });
    } catch (error: any) {
      const detail = error?.response || error?.message || 'Unknown SMTP error';
      console.error('Password reset email send failed:', detail);
      throw new BadRequestException(
        `Failed to send reset email. Check SMTP credentials and sender settings. Detail: ${detail}`,
      );
    }

    return genericResponse;
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload?.type !== 'password_reset' || !payload?.sub) {
      throw new BadRequestException('Invalid reset token payload');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { password: hashedPassword },
    });

    return { message: 'Password reset successful. You can now log in.' };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
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
  }
}