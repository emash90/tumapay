import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet } from '../../database/entities/wallet.entity';
import { WalletTransaction } from '../../database/entities/wallet-transaction.entity';
import { AuthModule } from '../auth/auth.module';
import { BusinessModule } from '../business/business.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { MpesaModule } from '../mpesa/mpesa.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletTransaction]),
    AuthModule,
    BusinessModule,
    TransactionsModule,
    MpesaModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
