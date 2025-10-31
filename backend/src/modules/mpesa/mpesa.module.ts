import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MpesaService } from './mpesa.service';
import { MpesaController } from './mpesa.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    ConfigModule, // For accessing environment variables
    TransactionsModule, // For TransactionsService
    forwardRef(() => WalletModule), // For WalletService (circular dependency)
  ],
  controllers: [MpesaController],
  providers: [MpesaService],
  exports: [MpesaService],
})
export class MpesaModule {}
