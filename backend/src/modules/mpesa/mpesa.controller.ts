import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Inject, forwardRef } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MpesaCallbackDto } from './dto';
import { TransactionsService } from '../transactions/transactions.service';
import { WalletService } from '../wallet/wallet.service';
import { TransactionStatus } from '../../database/entities/transaction.entity';
import { WalletTransactionType } from '../../database/entities/wallet-transaction.entity';
import {
  MpesaStkPushCallbackResponse,
  MpesaB2CCallbackResponse,
} from './interfaces/mpesa-response.interface';

@ApiTags('mpesa-webhooks')
@Controller('mpesa/callback')
export class MpesaController {
  private readonly logger = new Logger(MpesaController.name);

  constructor(
    private transactionsService: TransactionsService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
  ) {}

  /**
   * M-Pesa STK Push callback handler
   * Called by M-Pesa when customer completes/cancels payment
   */
  @Post('stk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'M-Pesa STK Push callback',
    description: 'Webhook endpoint for M-Pesa STK Push payment notifications',
  })
  @ApiResponse({
    status: 200,
    description: 'Callback processed successfully',
  })
  async handleStkPushCallback(@Body() callbackData: MpesaStkPushCallbackResponse) {
    try {
      this.logger.log('Received STK Push callback');
      this.logger.debug(JSON.stringify(callbackData, null, 2));

      const { stkCallback } = callbackData.Body;
      const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = stkCallback;

      // Find transaction by CheckoutRequestID (stored as providerTransactionId)
      const transaction = await this.transactionsService.findByProviderTransactionId(
        CheckoutRequestID,
      );

      if (!transaction) {
        this.logger.warn(`Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
        return {
          ResultCode: 0,
          ResultDesc: 'Accepted',
        };
      }

      // ResultCode 0 = Success
      if (ResultCode === 0 && CallbackMetadata) {
        // Extract payment details from metadata
        const metadata = CallbackMetadata.Item;
        const mpesaReceiptNumber = metadata.find((item) => item.Name === 'MpesaReceiptNumber')
          ?.Value as string;
        const amount = metadata.find((item) => item.Name === 'Amount')?.Value as number;
        const phoneNumber = metadata.find((item) => item.Name === 'PhoneNumber')?.Value as string;

        // If transaction has walletId, credit the wallet
        if (transaction.walletId) {
          try {
            await this.walletService.creditWallet(
              transaction.walletId,
              transaction.amount,
              WalletTransactionType.DEPOSIT,
              `M-Pesa deposit - ${transaction.reference}`,
              transaction.id,
              {
                mpesaCheckoutRequestId: CheckoutRequestID,
                mpesaReceiptNumber,
                phoneNumber,
              },
            );

            this.logger.log(
              `Wallet ${transaction.walletId} credited with ${transaction.amount} ${transaction.walletCurrency}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to credit wallet ${transaction.walletId}`,
              error,
            );
            // Continue to update transaction status even if wallet credit fails
          }
        }

        // Update transaction to completed
        await this.transactionsService.updateTransactionStatus(transaction.id, {
          status: TransactionStatus.COMPLETED,
          providerTransactionId: mpesaReceiptNumber, // Update with M-Pesa receipt number
          completedAt: new Date(),
          metadata: {
            ...transaction.metadata,
            mpesaReceiptNumber,
            amountPaid: amount,
            phoneNumber,
          },
        });

        this.logger.log(
          `Transaction ${transaction.reference} completed successfully. Receipt: ${mpesaReceiptNumber}`,
        );
      } else {
        // Payment failed or was cancelled
        await this.transactionsService.updateTransactionStatus(transaction.id, {
          status: TransactionStatus.FAILED,
          errorMessage: ResultDesc,
          errorCode: ResultCode.toString(),
          failedAt: new Date(),
        });

        this.logger.warn(
          `Transaction ${transaction.reference} failed. Code: ${ResultCode}, Desc: ${ResultDesc}`,
        );
      }

      return {
        ResultCode: 0,
        ResultDesc: 'Accepted',
      };
    } catch (error) {
      this.logger.error('Error processing STK Push callback', error);
      // Still return success to M-Pesa to avoid retries
      return {
        ResultCode: 0,
        ResultDesc: 'Accepted',
      };
    }
  }

  /**
   * M-Pesa B2C result callback handler
   * Called by M-Pesa when B2C payment is processed
   */
  @Post('b2c/result')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'M-Pesa B2C result callback',
    description: 'Webhook endpoint for M-Pesa B2C payment result notifications',
  })
  @ApiResponse({
    status: 200,
    description: 'Callback processed successfully',
  })
  async handleB2CResultCallback(@Body() callbackData: MpesaB2CCallbackResponse) {
    try {
      this.logger.log('Received B2C result callback');
      this.logger.debug(JSON.stringify(callbackData, null, 2));

      const { Result } = callbackData;
      const { ResultCode, ResultDesc, TransactionID, ConversationID } = Result;

      // Find transaction by ConversationID (stored as providerTransactionId)
      const transaction = await this.transactionsService.findByProviderTransactionId(
        ConversationID,
      );

      if (!transaction) {
        this.logger.warn(`Transaction not found for ConversationID: ${ConversationID}`);
        return {
          ResultCode: 0,
          ResultDesc: 'Accepted',
        };
      }

      // ResultCode 0 = Success
      if (ResultCode === 0) {
        // Extract payment details from result parameters
        const resultParams = Result.ResultParameters?.ResultParameter || [];
        const transactionReceipt = resultParams.find(
          (item) => item.Key === 'TransactionReceipt',
        )?.Value as string;
        const recipientPhone = resultParams.find((item) => item.Key === 'ReceiverPartyPublicName')
          ?.Value as string;

        // Update transaction to completed
        await this.transactionsService.updateTransactionStatus(transaction.id, {
          status: TransactionStatus.COMPLETED,
          providerTransactionId: TransactionID || transactionReceipt,
          completedAt: new Date(),
          metadata: {
            ...transaction.metadata,
            mpesaTransactionId: TransactionID,
            transactionReceipt,
            recipientPhone,
          },
        });

        this.logger.log(
          `Transaction ${transaction.reference} completed successfully. TransactionID: ${TransactionID}`,
        );
      } else {
        // Payment failed
        await this.transactionsService.updateTransactionStatus(transaction.id, {
          status: TransactionStatus.FAILED,
          errorMessage: ResultDesc,
          errorCode: ResultCode.toString(),
          failedAt: new Date(),
        });

        this.logger.warn(
          `Transaction ${transaction.reference} failed. Code: ${ResultCode}, Desc: ${ResultDesc}`,
        );
      }

      return {
        ResultCode: 0,
        ResultDesc: 'Accepted',
      };
    } catch (error) {
      this.logger.error('Error processing B2C result callback', error);
      return {
        ResultCode: 0,
        ResultDesc: 'Accepted',
      };
    }
  }

  /**
   * M-Pesa B2C timeout callback handler
   * Called by M-Pesa when B2C payment times out
   */
  @Post('b2c/timeout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'M-Pesa B2C timeout callback',
    description: 'Webhook endpoint for M-Pesa B2C payment timeout notifications',
  })
  @ApiResponse({
    status: 200,
    description: 'Callback processed successfully',
  })
  async handleB2CTimeoutCallback(@Body() callbackData: any) {
    try {
      this.logger.log('Received B2C timeout callback');
      this.logger.debug(JSON.stringify(callbackData, null, 2));

      // Handle timeout - mark transaction as failed
      // Implementation depends on M-Pesa timeout callback structure

      return {
        ResultCode: 0,
        ResultDesc: 'Accepted',
      };
    } catch (error) {
      this.logger.error('Error processing B2C timeout callback', error);
      return {
        ResultCode: 0,
        ResultDesc: 'Accepted',
      };
    }
  }
}
