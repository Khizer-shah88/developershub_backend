import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { name: string; email: string; password: string }) {
    if (!body?.name || !body?.email || !body?.password) {
      throw new BadRequestException('name, email, and password are required');
    }

    return this.authService.register(body.name, body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    if (!body?.email || !body?.password) {
      throw new BadRequestException('email and password are required');
    }

    return this.authService.login(body.email, body.password);
  }

  @Post('setup-admin')
  async setupAdmin(
    @Body() body: { name?: string; email: string; password: string },
  ) {
    if (!body?.email || !body?.password) {
      throw new BadRequestException('email and password are required');
    }

    const name = body.name?.trim() || 'Admin';
    return this.authService.setupAdmin(name, body.email, body.password);
  }

  @Post('request-password-reset')
  async requestPasswordReset(@Body() body: { email: string }) {
    if (!body?.email) {
      throw new BadRequestException('email is required');
    }

    return this.authService.requestPasswordReset(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    if (!body?.token || !body?.newPassword) {
      throw new BadRequestException('token and newPassword are required');
    }

    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'CLIENT')
  async me(@Req() req: any) {
    const userId = req?.user?.sub ?? req?.user?.id;
    return this.authService.me(userId);
  }
}