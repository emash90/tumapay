import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, IsNull } from 'typeorm';
import { Beneficiary } from '../../database/entities/beneficiary.entity';
import { IbanValidator } from './validators/iban.validator';
import { TcKimlikValidator } from './validators/tc-kimlik.validator';

/**
 * Beneficiary Service
 *
 * Handles CRUD operations for Turkish beneficiaries with business isolation.
 *
 * Features:
 * - Create beneficiary with IBAN and TC Kimlik validation
 * - List beneficiaries (filtered by business, active status)
 * - Update beneficiary details
 * - Soft delete beneficiaries
 * - Business isolation - users can only access their own business's beneficiaries
 * - Duplicate IBAN prevention (per business)
 */
@Injectable()
export class BeneficiariesService {
  constructor(
    @InjectRepository(Beneficiary)
    private readonly beneficiaryRepository: Repository<Beneficiary>,
    private readonly ibanValidator: IbanValidator,
    private readonly tcKimlikValidator: TcKimlikValidator,
  ) {}

  /**
   * Creates a new beneficiary
   *
   * @param businessId - Business ID that owns this beneficiary
   * @param data - Beneficiary data
   * @returns Created beneficiary
   * @throws BadRequestException if validation fails
   * @throws ConflictException if IBAN already exists for this business
   */
  async create(
    businessId: string,
    data: {
      name: string;
      iban: string;
      nationalId: string;
      country?: string;
      currency?: string;
      bankName?: string;
      bankCode?: string;
      phone?: string;
      email?: string;
      additionalDetails?: Record<string, any>;
    },
  ): Promise<Beneficiary> {
    // Validate and normalize IBAN
    const normalizedIban = this.ibanValidator.validateAndNormalize(data.iban);

    // Validate and normalize TC Kimlik
    const normalizedTcKimlik = this.tcKimlikValidator.validateAndNormalize(
      data.nationalId,
    );

    // Check if IBAN already exists for this business (exclude soft-deleted)
    await this.checkDuplicateIban(businessId, normalizedIban);

    // Extract bank code from IBAN if not provided
    const bankCode = data.bankCode || this.ibanValidator.extractBankCode(normalizedIban);

    // Create beneficiary entity
    const beneficiary = this.beneficiaryRepository.create({
      businessId,
      name: data.name.trim(),
      country: data.country || 'TR',
      currency: data.currency || 'TRY',
      iban: normalizedIban,
      nationalId: normalizedTcKimlik,
      bankName: data.bankName?.trim() || null,
      bankCode: bankCode || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim().toLowerCase() || null,
      additionalDetails: data.additionalDetails || null,
      isVerified: false, // New beneficiaries start as unverified
    });

    return await this.beneficiaryRepository.save(beneficiary);
  }

  /**
   * Finds all beneficiaries for a business
   *
   * @param businessId - Business ID to filter by
   * @param options - Filter options
   * @returns Array of beneficiaries
   */
  async findAll(
    businessId: string,
    options: {
      isActive?: boolean;
      isVerified?: boolean;
      includeDeleted?: boolean;
    } = {},
  ): Promise<Beneficiary[]> {
    const where: FindOptionsWhere<Beneficiary> = {
      businessId,
    };

    // Filter by active status
    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    // Filter by verified status
    if (options.isVerified !== undefined) {
      where.isVerified = options.isVerified;
    }

    // Exclude soft-deleted by default
    if (!options.includeDeleted) {
      where.deletedAt = IsNull();
    }

    return await this.beneficiaryRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Finds a single beneficiary by ID
   *
   * @param id - Beneficiary ID
   * @param businessId - Business ID for authorization check
   * @returns Beneficiary
   * @throws NotFoundException if beneficiary not found
   * @throws ForbiddenException if beneficiary belongs to different business
   */
  async findOne(id: string, businessId: string): Promise<Beneficiary> {
    const beneficiary = await this.beneficiaryRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!beneficiary) {
      throw new NotFoundException(`Beneficiary with ID ${id} not found`);
    }

    // Ensure beneficiary belongs to the requesting business
    if (beneficiary.businessId !== businessId) {
      throw new ForbiddenException(
        'You do not have permission to access this beneficiary',
      );
    }

    return beneficiary;
  }

  /**
   * Finds a beneficiary by IBAN for a specific business
   *
   * @param iban - IBAN to search for
   * @param businessId - Business ID
   * @returns Beneficiary or null if not found
   */
  async findByIban(
    iban: string,
    businessId: string,
  ): Promise<Beneficiary | null> {
    const normalizedIban = this.ibanValidator.normalizeIban(iban);

    return await this.beneficiaryRepository.findOne({
      where: {
        businessId,
        iban: normalizedIban,
        deletedAt: IsNull(),
      },
    });
  }

  /**
   * Updates a beneficiary
   *
   * @param id - Beneficiary ID
   * @param businessId - Business ID for authorization check
   * @param data - Updated beneficiary data
   * @returns Updated beneficiary
   * @throws NotFoundException if beneficiary not found
   * @throws ForbiddenException if beneficiary belongs to different business
   * @throws ConflictException if new IBAN conflicts with existing beneficiary
   */
  async update(
    id: string,
    businessId: string,
    data: {
      name?: string;
      iban?: string;
      nationalId?: string;
      bankName?: string;
      bankCode?: string;
      phone?: string;
      email?: string;
      additionalDetails?: Record<string, any>;
      isActive?: boolean;
      isVerified?: boolean;
    },
  ): Promise<Beneficiary> {
    // Find and authorize
    const beneficiary = await this.findOne(id, businessId);

    // Update name
    if (data.name !== undefined) {
      beneficiary.name = data.name.trim();
    }

    // Update and validate IBAN if changed
    if (data.iban !== undefined) {
      const normalizedIban = this.ibanValidator.validateAndNormalize(data.iban);

      // Check if IBAN changed
      if (normalizedIban !== beneficiary.iban) {
        // Check for duplicate IBAN (exclude current beneficiary)
        await this.checkDuplicateIban(businessId, normalizedIban, id);
        beneficiary.iban = normalizedIban;

        // Auto-update bank code from new IBAN if not explicitly provided
        if (data.bankCode === undefined) {
          beneficiary.bankCode = this.ibanValidator.extractBankCode(normalizedIban);
        }
      }
    }

    // Update and validate TC Kimlik if changed
    if (data.nationalId !== undefined) {
      beneficiary.nationalId = this.tcKimlikValidator.validateAndNormalize(
        data.nationalId,
      );
    }

    // Update other fields
    if (data.bankName !== undefined) {
      beneficiary.bankName = data.bankName?.trim() || null;
    }

    if (data.bankCode !== undefined) {
      beneficiary.bankCode = data.bankCode?.trim() || null;
    }

    if (data.phone !== undefined) {
      beneficiary.phone = data.phone?.trim() || null;
    }

    if (data.email !== undefined) {
      beneficiary.email = data.email?.trim().toLowerCase() || null;
    }

    if (data.additionalDetails !== undefined) {
      beneficiary.additionalDetails = data.additionalDetails;
    }

    if (data.isActive !== undefined) {
      beneficiary.isActive = data.isActive;
    }

    if (data.isVerified !== undefined) {
      beneficiary.isVerified = data.isVerified;
    }

    return await this.beneficiaryRepository.save(beneficiary);
  }

  /**
   * Soft deletes a beneficiary
   *
   * @param id - Beneficiary ID
   * @param businessId - Business ID for authorization check
   * @throws NotFoundException if beneficiary not found
   * @throws ForbiddenException if beneficiary belongs to different business
   */
  async delete(id: string, businessId: string): Promise<void> {
    // Find and authorize
    const beneficiary = await this.findOne(id, businessId);

    // Soft delete by setting deletedAt timestamp
    beneficiary.deletedAt = new Date();

    await this.beneficiaryRepository.save(beneficiary);
  }

  /**
   * Restores a soft-deleted beneficiary
   *
   * @param id - Beneficiary ID
   * @param businessId - Business ID for authorization check
   * @returns Restored beneficiary
   * @throws NotFoundException if beneficiary not found
   * @throws ForbiddenException if beneficiary belongs to different business
   */
  async restore(id: string, businessId: string): Promise<Beneficiary> {
    const beneficiary = await this.beneficiaryRepository.findOne({
      where: { id },
      withDeleted: true, // Include soft-deleted records
    });

    if (!beneficiary) {
      throw new NotFoundException(`Beneficiary with ID ${id} not found`);
    }

    // Ensure beneficiary belongs to the requesting business
    if (beneficiary.businessId !== businessId) {
      throw new ForbiddenException(
        'You do not have permission to access this beneficiary',
      );
    }

    if (!beneficiary.deletedAt) {
      throw new BadRequestException('Beneficiary is not deleted');
    }

    // Check if IBAN is still unique (another beneficiary might have claimed it)
    await this.checkDuplicateIban(businessId, beneficiary.iban, id);

    // Restore by clearing deletedAt
    beneficiary.deletedAt = undefined;

    return await this.beneficiaryRepository.save(beneficiary);
  }

  /**
   * Counts beneficiaries for a business
   *
   * @param businessId - Business ID
   * @param options - Filter options
   * @returns Count of beneficiaries
   */
  async count(
    businessId: string,
    options: {
      isActive?: boolean;
      isVerified?: boolean;
    } = {},
  ): Promise<number> {
    const where: FindOptionsWhere<Beneficiary> = {
      businessId,
      deletedAt: IsNull(),
    };

    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options.isVerified !== undefined) {
      where.isVerified = options.isVerified;
    }

    return await this.beneficiaryRepository.count({ where });
  }

  /**
   * Marks a beneficiary as verified
   *
   * @param id - Beneficiary ID
   * @param businessId - Business ID for authorization check
   * @returns Updated beneficiary
   */
  async markAsVerified(id: string, businessId: string): Promise<Beneficiary> {
    return await this.update(id, businessId, { isVerified: true });
  }

  /**
   * Deactivates a beneficiary (soft disable)
   *
   * @param id - Beneficiary ID
   * @param businessId - Business ID for authorization check
   * @returns Updated beneficiary
   */
  async deactivate(id: string, businessId: string): Promise<Beneficiary> {
    return await this.update(id, businessId, { isActive: false });
  }

  /**
   * Activates a beneficiary
   *
   * @param id - Beneficiary ID
   * @param businessId - Business ID for authorization check
   * @returns Updated beneficiary
   */
  async activate(id: string, businessId: string): Promise<Beneficiary> {
    return await this.update(id, businessId, { isActive: true });
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Checks if IBAN already exists for a business
   *
   * @throws ConflictException if duplicate found
   */
  private async checkDuplicateIban(
    businessId: string,
    iban: string,
    excludeId?: string,
  ): Promise<void> {
    const where: FindOptionsWhere<Beneficiary> = {
      businessId,
      iban,
      deletedAt: IsNull(), // Only check non-deleted beneficiaries
    };

    const existing = await this.beneficiaryRepository.findOne({ where });

    // If found and it's not the beneficiary we're updating
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `A beneficiary with IBAN ${this.ibanValidator.formatIban(iban)} already exists for this business`,
      );
    }
  }
}
