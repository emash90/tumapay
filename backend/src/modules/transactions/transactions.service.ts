import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from '../../database/entities/transaction.entity';
import { CreateTransactionDto } from './dto';
import { generateTransactionReference } from './utils/transaction-reference.util';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  /**
   * Create a new transaction
   */
  async createTransaction(
    createTransactionDto: CreateTransactionDto,
    businessId: string,
    userId: string,
  ): Promise<Transaction> {
    // Validate recipient information based on transaction type
    this.validateRecipientInfo(createTransactionDto);

    // Generate unique transaction reference
    const reference = generateTransactionReference();

    // Ensure reference is unique (collision check)
    const existingTransaction = await this.findByReference(reference);
    if (existingTransaction) {
      // Extremely rare case - retry with new reference
      return this.createTransaction(createTransactionDto, businessId, userId);
    }

    // Create transaction
    const transaction = this.transactionRepository.create({
      reference,
      amount: createTransactionDto.amount,
      currency: createTransactionDto.currency || 'KES',
      type: createTransactionDto.type,
      status: TransactionStatus.PENDING,
      businessId,
      userId,
      recipientPhone: createTransactionDto.recipientPhone || null,
      recipientAccount: createTransactionDto.recipientAccount || null,
      recipientBankCode: createTransactionDto.recipientBankCode || null,
      description: createTransactionDto.description || null,
      metadata: createTransactionDto.metadata || null,
      retryCount: 0,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Fetch with relations for complete response
    return this.findById(savedTransaction.id);
  }

  /**
   * Validate recipient information based on transaction type
   */
  private validateRecipientInfo(dto: CreateTransactionDto): void {
    const { type, recipientPhone, recipientAccount, recipientBankCode } = dto;

    // For payout and collection transactions, require recipient phone (M-Pesa)
    if ((type === 'payout' || type === 'collection') && !recipientPhone) {
      throw new BadRequestException(
        `Recipient phone number is required for ${type} transactions`,
      );
    }

    // For transfer transactions, require account details
    if (type === 'transfer') {
      if (!recipientAccount || !recipientBankCode) {
        throw new BadRequestException(
          'Recipient account number and bank code are required for transfer transactions',
        );
      }
    }
  }

  /**
   * Find transaction by ID
   */
  async findById(transactionId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['business', 'user'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  /**
   * Find transaction by reference
   */
  async findByReference(reference: string): Promise<Transaction | null> {
    return await this.transactionRepository.findOne({
      where: { reference },
      relations: ['business', 'user'],
    });
  }

  /**
   * Get all transactions for a business
   */
  async findByBusinessId(businessId: string): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  /**
   * Get all transactions created by a user
   */
  async findByUserId(userId: string): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['business'],
    });
  }
}
