import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../../database/entities/transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

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
