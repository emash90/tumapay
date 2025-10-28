import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction } from '../../database/entities/transaction.entity';
import { AuthModule } from '../auth/auth.module';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    AuthModule, // For AuthGuard
    BusinessModule, // For BusinessService
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
