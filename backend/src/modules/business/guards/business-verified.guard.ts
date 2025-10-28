import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BusinessService } from '../business.service';
import { BusinessKYBStatus } from '../../../database/entities/business.entity';

/**
 * Guard to ensure user's business is verified before accessing certain routes
 * Used for operations that require KYB verification (e.g., creating transactions)
 *
 * @example
 * @UseGuards(AuthGuard, BusinessVerifiedGuard)
 * @Post('/transactions')
 * createTransaction() {}
 */
@Injectable()
export class BusinessVerifiedGuard implements CanActivate {
  constructor(private businessService: BusinessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user's business
    const business = await this.businessService.getBusinessByUserId(user.id);

    if (!business) {
      throw new NotFoundException(
        'No business profile found. Please complete your business registration.',
      );
    }

    // Check if business is verified
    if (business.kybStatus !== BusinessKYBStatus.VERIFIED) {
      throw new ForbiddenException(
        `Business verification required. Current status: ${business.kybStatus}. ` +
        'Please complete KYB verification to access this feature.',
      );
    }

    // Attach business to request for use in controller
    request.business = business;

    return true;
  }
}
