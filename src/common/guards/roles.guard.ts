import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { verify } from 'jsonwebtoken';

type JwtUser = {
  sub?: string;
  email?: string;
  role?: string;
};

const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    let user = request.user as JwtUser | undefined;

    if (!user?.role) {
      const authHeader = request.headers?.authorization as string | undefined;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : undefined;

      if (token) {
        try {
          const payload = verify(token, jwtSecret) as JwtUser;
          user = {
            sub: payload.sub,
            email: payload.email,
            role: payload.role,
          };
          request.user = user;
        } catch {
          return false;
        }
      }
    }

    if (!user?.role) return false;

    return requiredRoles.includes(user.role);
  }
}

