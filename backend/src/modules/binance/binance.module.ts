import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BinanceService } from './binance.service';
import { BinanceController } from './binance.controller';
import { AuthModule } from '../auth/auth.module';
import { ConversionModule } from '../conversion/conversion.module';
import { WalletModule } from '../wallet/wallet.module';
import { BinanceWithdrawal } from '../../database/entities/binance-withdrawal.entity';
import { Transaction } from '../../database/entities/transaction.entity';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    ConversionModule,
    WalletModule,
    TypeOrmModule.forFeature([BinanceWithdrawal, Transaction]),
  ],
  controllers: [BinanceController],
  providers: [BinanceService],
  exports: [BinanceService],
})
export class BinanceModule {}
