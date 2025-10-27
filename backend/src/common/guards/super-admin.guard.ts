import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Guard to ensure only super admin users can access the route
 * Used for admin-only operations like business verification, tier management, etc.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!user.isSuperAdmin) {
      throw new ForbiddenException('Access denied. Super admin privileges required.');
    }

    return true;
  }
}
