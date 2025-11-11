import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { Beneficiary } from '../../../database/entities/beneficiary.entity';

/**
 * DTO for beneficiary API responses
 *
 * Excludes sensitive fields like nationalId from API responses
 * Includes formatted fields for better UX
 */
@Exclude()
export class BeneficiaryResponseDto {
  @ApiProperty({
    description: 'Beneficiary ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Business ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Expose()
  businessId: string;

  @ApiProperty({
    description: 'Full name of the beneficiary',
    example: 'Ahmet Yılmaz',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'ISO country code',
    example: 'TR',
  })
  @Expose()
  country: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'TRY',
  })
  @Expose()
  currency: string;

  @ApiProperty({
    description: 'Turkish IBAN',
    example: 'TR330006100519786457841326',
  })
  @Expose()
  iban: string;

  @ApiProperty({
    description: 'Formatted IBAN with spaces',
    example: 'TR33 0006 1005 1978 6457 8413 26',
  })
  @Expose()
  @Transform(({ obj }) => {
    const iban = obj.iban;
    return iban ? iban.replace(/(.{4})/g, '$1 ').trim() : null;
  })
  ibanFormatted: string;

  @ApiPropertyOptional({
    description: 'Name of the bank',
    example: 'Garanti BBVA',
  })
  @Expose()
  bankName: string | null;

  @ApiPropertyOptional({
    description: 'SWIFT/BIC code',
    example: 'TGBATRIS',
  })
  @Expose()
  bankCode: string | null;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+905551234567',
  })
  @Expose()
  phone: string | null;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'ahmet.yilmaz@example.com',
  })
  @Expose()
  email: string | null;

  @ApiPropertyOptional({
    description: 'Additional beneficiary details',
    example: {
      address: 'Atatürk Caddesi No:123',
      city: 'Istanbul',
    },
  })
  @Expose()
  additionalDetails: Record<string, any> | null;

  @ApiProperty({
    description: 'Whether the beneficiary is verified',
    example: false,
  })
  @Expose()
  isVerified: boolean;

  @ApiProperty({
    description: 'Whether the beneficiary is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  /**
   * Creates a response DTO from a Beneficiary entity
   */
  static fromEntity(beneficiary: Beneficiary): BeneficiaryResponseDto {
    const dto = new BeneficiaryResponseDto();
    dto.id = beneficiary.id;
    dto.businessId = beneficiary.businessId;
    dto.name = beneficiary.name;
    dto.country = beneficiary.country;
    dto.currency = beneficiary.currency;
    dto.iban = beneficiary.iban;
    dto.ibanFormatted = beneficiary.iban
      ? beneficiary.iban.replace(/(.{4})/g, '$1 ').trim()
      : '';
    dto.bankName = beneficiary.bankName;
    dto.bankCode = beneficiary.bankCode;
    dto.phone = beneficiary.phone;
    dto.email = beneficiary.email;
    dto.additionalDetails = beneficiary.additionalDetails;
    dto.isVerified = beneficiary.isVerified;
    dto.isActive = beneficiary.isActive;
    dto.createdAt = beneficiary.createdAt;
    dto.updatedAt = beneficiary.updatedAt;
    return dto;
  }

  /**
   * Creates response DTOs from an array of Beneficiary entities
   */
  static fromEntities(beneficiaries: Beneficiary[]): BeneficiaryResponseDto[] {
    return beneficiaries.map((beneficiary) =>
      BeneficiaryResponseDto.fromEntity(beneficiary),
    );
  }
}

/**
 * DTO for beneficiary details with sensitive information (admin only)
 * Includes nationalId field for compliance and admin verification
 */
export class BeneficiaryAdminResponseDto extends BeneficiaryResponseDto {
  @ApiProperty({
    description: 'Turkish National ID (TC Kimlik) - SENSITIVE',
    example: '123******01',
  })
  @Expose()
  @Transform(({ obj }) => {
    const nationalId = obj.nationalId;
    // Mask national ID: show first 3 and last 2 digits
    return nationalId
      ? `${nationalId.substring(0, 3)}******${nationalId.substring(9, 11)}`
      : null;
  })
  nationalIdMasked: string;

  /**
   * Creates an admin response DTO from a Beneficiary entity
   */
  static fromEntity(beneficiary: Beneficiary): BeneficiaryAdminResponseDto {
    const dto = new BeneficiaryAdminResponseDto();
    Object.assign(dto, BeneficiaryResponseDto.fromEntity(beneficiary));
    dto.nationalIdMasked = beneficiary.nationalId
      ? `${beneficiary.nationalId.substring(0, 3)}******${beneficiary.nationalId.substring(9, 11)}`
      : '';
    return dto;
  }
}
