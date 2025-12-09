import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FlutterwaveService } from './flutterwave.service';

/**
 * Flutterwave Module
 *
 * Provides Flutterwave integration for deposits via bank transfers, cards, and other payment methods.
 *
 * Features:
 * - Bank transfer deposits
 * - Card payments
 * - Transaction verification
 * - Webhook signature verification
 * - Multi-currency support (KES, USD, NGN, GHS, ZAR, TZS, UGX)
 *
 * Services:
 * - FlutterwaveService: Handles all Flutterwave API interactions
 */
@Module({
  imports: [
    ConfigModule, // For accessing environment variables
  ],
  providers: [FlutterwaveService],
  exports: [FlutterwaveService],
})
export class FlutterwaveModule {}
