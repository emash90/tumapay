import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business, BusinessKYBStatus, BusinessTier } from '../../database/entities/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
  ) {}

  /**
   * Create a new business for a user
   */
  async createBusiness(
    createBusinessDto: CreateBusinessDto,
  ): Promise<Business> {
    // Validate KRA PIN is required for Kenyan businesses
    if (createBusinessDto.country === 'KE' && !createBusinessDto.kraPin) {
      throw new BadRequestException(
        'KRA PIN is required for businesses registered in Kenya',
      );
    }

    // Check if registration number already exists
    await this.checkRegistrationNumberExists(
      createBusinessDto.registrationNumber,
    );

    // Create business
    const business = this.businessRepository.create({
      ...createBusinessDto,
      kybStatus: BusinessKYBStatus.PENDING,
      tier: BusinessTier.BASIC,
      dailyLimit: 10000, // Default: KES 10,000 per day
      monthlyLimit: 50000, // Default: KES 50,000 per month
    });

    return await this.businessRepository.save(business);
  }

  /**
   * Get business by user ID
   */
  async getBusinessByUserId(userId: string): Promise<Business | null> {
    const business = await this.businessRepository
      .createQueryBuilder('business')
      .innerJoin('business.user', 'user')
      .where('user.id = :userId', { userId })
      .getOne();

    return business;
  }

  /**
   * Get business by ID
   */
  async getBusinessById(businessId: string): Promise<Business> {
    const business = await this.businessRepository.findOne({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business;
  }

  /**
   * Update business details
   */
  async updateBusiness(
    userId: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<Business> {
    // Find business by user ID
    const business = await this.getBusinessByUserId(userId);

    if (!business) {
      throw new NotFoundException('Business not found for this user');
    }

    // Update only provided fields
    Object.assign(business, updateBusinessDto);

    return await this.businessRepository.save(business);
  }

  /**
   * Check if registration number exists (for validation)
   */
  async checkRegistrationNumberExists(
    registrationNumber: string,
  ): Promise<void> {
    const existingBusiness = await this.businessRepository.findOne({
      where: { registrationNumber },
    });

    if (existingBusiness) {
      throw new ConflictException(
        'A business with this registration number already exists',
      );
    }
  }

  /**
   * Update KYB status (for admin use)
   */
  async updateKYBStatus(
    businessId: string,
    status: BusinessKYBStatus,
    rejectionReason?: string,
  ): Promise<Business> {
    const business = await this.getBusinessById(businessId);

    business.kybStatus = status;

    if (status === BusinessKYBStatus.VERIFIED) {
      business.kybVerifiedAt = new Date();
      business.kybRejectionReason = null;
    } else if (status === BusinessKYBStatus.REJECTED) {
      business.kybRejectionReason = rejectionReason || null;
      business.kybVerifiedAt = null;
    }

    return await this.businessRepository.save(business);
  }

  /**
   * Update business tier (for admin use)
   */
  async updateTier(
    businessId: string,
    tier: BusinessTier,
    dailyLimit?: number,
    monthlyLimit?: number,
  ): Promise<Business> {
    const business = await this.getBusinessById(businessId);

    business.tier = tier;

    // Update limits based on tier if not provided
    if (dailyLimit !== undefined) {
      business.dailyLimit = dailyLimit;
    } else {
      // Default limits per tier
      switch (tier) {
        case BusinessTier.BASIC:
          business.dailyLimit = 10000;
          business.monthlyLimit = 50000;
          break;
        case BusinessTier.PREMIUM:
          business.dailyLimit = 50000;
          business.monthlyLimit = 200000;
          break;
        case BusinessTier.ENTERPRISE:
          business.dailyLimit = 500000;
          business.monthlyLimit = 5000000;
          break;
      }
    }

    if (monthlyLimit !== undefined) {
      business.monthlyLimit = monthlyLimit;
    }

    return await this.businessRepository.save(business);
  }

  /**
   * Soft delete business
   */
  async deleteBusiness(userId: string): Promise<void> {
    const business = await this.getBusinessByUserId(userId);

    if (!business) {
      throw new NotFoundException('Business not found for this user');
    }

    await this.businessRepository.softDelete(business.id);
  }

  /**
   * Get all businesses (for admin use)
   */
  async getAllBusinesses(
    page: number = 1,
    limit: number = 10,
    status?: BusinessKYBStatus,
    tier?: BusinessTier,
  ): Promise<{ businesses: Business[]; total: number; page: number }> {
    const query = this.businessRepository.createQueryBuilder('business');

    if (status) {
      query.where('business.kybStatus = :status', { status });
    }

    if (tier) {
      query.andWhere('business.tier = :tier', { tier });
    }

    const [businesses, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('business.createdAt', 'DESC')
      .getManyAndCount();

    return {
      businesses,
      total,
      page,
    };
  }
}
