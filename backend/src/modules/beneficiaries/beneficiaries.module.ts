import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BeneficiariesController } from './beneficiaries.controller';
import { BeneficiariesService } from './beneficiaries.service';
import { Beneficiary } from '../../database/entities/beneficiary.entity';
import { IbanValidator, TcKimlikValidator } from './validators';
import {
  IsValidIbanConstraint,
  IsValidTcKimlikConstraint,
} from './decorators';

/**
 * Beneficiaries Module
 *
 * Provides beneficiary management functionality for Turkish bank accounts.
 *
 * Features:
 * - CRUD operations for beneficiaries
 * - Turkish IBAN validation (MOD-97 checksum)
 * - Turkish National ID (TC Kimlik) validation
 * - Business isolation
 * - Soft delete support
 * - Duplicate IBAN prevention
 *
 * Exports:
 * - BeneficiariesService - For use in other modules (e.g., payouts)
 * - IbanValidator - For standalone IBAN validation
 * - TcKimlikValidator - For standalone TC Kimlik validation
 */
@Module({
  imports: [TypeOrmModule.forFeature([Beneficiary])],
  controllers: [BeneficiariesController],
  providers: [
    // Core service
    BeneficiariesService,

    // Validators
    IbanValidator,
    TcKimlikValidator,

    // Custom validator constraints for class-validator integration
    IsValidIbanConstraint,
    IsValidTcKimlikConstraint,
  ],
  exports: [
    // Export service for use in other modules (e.g., payouts, transactions)
    BeneficiariesService,

    // Export validators for standalone use
    IbanValidator,
    TcKimlikValidator,
  ],
})
export class BeneficiariesModule {}
