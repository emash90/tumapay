import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark routes that require super admin access
 * Use with SuperAdminGuard
 *
 * @example
 * @UseGuards(AuthGuard, SuperAdminGuard)
 * @SuperAdmin()
 * @Get('/admin/businesses')
 * getAllBusinesses() {}
 */
export const SUPER_ADMIN_KEY = 'isSuperAdmin';
export const SuperAdmin = () => SetMetadata(SUPER_ADMIN_KEY, true);
