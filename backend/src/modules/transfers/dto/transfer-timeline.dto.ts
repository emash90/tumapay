import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for transfer timeline step
 *
 * Represents a single step in the transfer orchestration process
 */
export class TransferTimelineDto {
  @ApiProperty({
    description: 'Timeline entry ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Step name/identifier',
    example: 'wallet_debited',
    examples: [
      'transfer_initiated',
      'beneficiary_validated',
      'wallet_debited',
      'exchange_rate_calculated',
      'tron_transfer_sent',
      'tron_confirmed',
      'transfer_completed',
      'rollback_started',
      'rollback_completed',
    ],
  })
  step: string;

  @ApiProperty({
    description: 'Step status',
    enum: ['success', 'failed', 'pending'],
    example: 'success',
  })
  status: 'success' | 'failed' | 'pending';

  @ApiPropertyOptional({
    description: 'Human-readable message about this step',
    example: 'Wallet debited successfully',
  })
  message?: string;

  @ApiProperty({
    description: 'Step timestamp',
    example: '2024-01-15T10:30:15.000Z',
  })
  timestamp: Date;

  @ApiPropertyOptional({
    description: 'Additional metadata about this step (amounts, rates, txHashes, etc.)',
    example: {
      amount: 5000,
      currency: 'KES',
      walletId: '123e4567-e89b-12d3-a456-426614174000',
    },
  })
  metadata?: Record<string, any>;
}
