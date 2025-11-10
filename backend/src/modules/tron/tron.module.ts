import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TronService } from './tron.service';
import { BlockchainTransactionService } from './blockchain-transaction.service';
import tronConfig from '../../config/tron.config';
import { BlockchainTransaction } from '../../database/entities/blockchain-transaction.entity';
import { Transaction } from '../../database/entities/transaction.entity';

@Module({
  imports: [
    ConfigModule.forFeature(tronConfig),
    TypeOrmModule.forFeature([BlockchainTransaction, Transaction]),
  ],
  providers: [TronService, BlockchainTransactionService],
  exports: [TronService, BlockchainTransactionService],
})
export class TronModule {}
