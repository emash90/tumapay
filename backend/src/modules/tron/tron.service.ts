import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
const { TronWeb } = require('tronweb');
import tronConfig from '../../config/tron.config';
import {
  SendUSDTResult,
  USDTBalance,
  TronTransactionStatus,
} from './interfaces';

@Injectable()
export class TronService {
  private readonly logger = new Logger(TronService.name);
  private tronWeb: any;

  // USDT on TRON uses 6 decimals
  private readonly USDT_DECIMALS = 6;
  private readonly USDT_DECIMAL_MULTIPLIER = 1_000_000;

  constructor(
    @Inject(tronConfig.KEY)
    private readonly config: ConfigType<typeof tronConfig>,
  ) {
    this.initializeTronWeb();
  }

  /**
   * Initialize TronWeb client with configuration
   */
  private initializeTronWeb(): void {
    try {
      this.tronWeb = new TronWeb({
        fullHost: this.config.apiUrl,
        privateKey: this.config.privateKey,
      });

      this.logger.log(
        `TronWeb initialized for network: ${this.config.network}`,
      );
      this.logger.log(`Connected to: ${this.config.apiUrl}`);
      this.logger.log(`Wallet address: ${this.config.walletAddress}`);
    } catch (error) {
      this.logger.error('Failed to initialize TronWeb', error.stack);
      throw error;
    }
  }

  /**
   * Get TronWeb instance (for testing or advanced usage)
   */
  getTronWeb(): any {
    return this.tronWeb;
  }

  /**
   * Check if TronWeb is properly initialized
   */
  isInitialized(): boolean {
    return !!this.tronWeb;
  }

  // ========================================
  // ADDRESS VALIDATION METHODS
  // ========================================

  /**
   * Validate a TRON address (returns boolean)
   */
  validateAddress(address: string): boolean {
    try {
      return this.tronWeb.isAddress(address);
    } catch (error) {
      this.logger.warn(`Address validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate and convert address to hex format
   * Throws exception if invalid
   */
  validateAndConvertAddress(address: string): string {
    if (!address) {
      throw new BadRequestException('Address is required');
    }

    if (!this.validateAddress(address)) {
      throw new BadRequestException(`Invalid TRON address: ${address}`);
    }

    try {
      // Convert to hex format for internal use
      return this.tronWeb.address.toHex(address);
    } catch (error) {
      throw new BadRequestException(`Failed to convert address: ${error.message}`);
    }
  }

  /**
   * Convert hex address to base58 (human-readable format)
   */
  hexToBase58(hexAddress: string): string {
    try {
      return this.tronWeb.address.fromHex(hexAddress);
    } catch (error) {
      throw new BadRequestException(`Invalid hex address: ${hexAddress}`);
    }
  }

  // ========================================
  // DECIMAL CONVERSION HELPERS
  // ========================================

  /**
   * Convert USDT amount to smallest unit (6 decimals)
   * Example: 100.5 USDT → 100500000
   */
  toSmallestUnit(amount: number): number {
    if (amount < 0) {
      throw new BadRequestException('Amount cannot be negative');
    }

    return Math.floor(amount * this.USDT_DECIMAL_MULTIPLIER);
  }

  /**
   * Convert from smallest unit to USDT
   * Example: 100500000 → 100.5 USDT
   */
  fromSmallestUnit(smallestUnit: number | string): number {
    const value = typeof smallestUnit === 'string'
      ? parseInt(smallestUnit, 10)
      : smallestUnit;

    return value / this.USDT_DECIMAL_MULTIPLIER;
  }

  /**
   * Convert TRX from SUN to TRX
   * 1 TRX = 1,000,000 SUN
   */
  sunToTrx(sun: number | string): number {
    const value = typeof sun === 'string' ? parseInt(sun, 10) : sun;
    return value / 1_000_000;
  }

  /**
   * Convert TRX to SUN
   */
  trxToSun(trx: number): number {
    return Math.floor(trx * 1_000_000);
  }

  // ========================================
  // TRX BALANCE METHODS
  // ========================================

  /**
   * Get TRX balance for an address
   * Returns balance in TRX (not SUN)
   */
  async getTRXBalance(address?: string): Promise<number> {
    try {
      const walletAddress = address || this.config.walletAddress;

      if (!walletAddress) {
        throw new BadRequestException('Wallet address not configured');
      }

      if (!this.validateAddress(walletAddress)) {
        throw new BadRequestException(`Invalid address: ${walletAddress}`);
      }

      const balanceInSun = await this.tronWeb.trx.getBalance(walletAddress);
      const balanceInTrx = this.sunToTrx(balanceInSun);

      this.logger.debug(
        `TRX balance for ${walletAddress}: ${balanceInTrx} TRX`,
      );

      return balanceInTrx;
    } catch (error) {
      this.logger.error(`Failed to get TRX balance: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to fetch TRX balance: ${error.message}`,
      );
    }
  }

  // ========================================
  // USDT BALANCE METHODS
  // ========================================

  /**
   * Get USDT balance for an address
   * Returns balance in USDT (not smallest unit)
   */
  async getUSDTBalance(address?: string): Promise<USDTBalance> {
    try {
      const walletAddress = address || this.config.walletAddress;

      if (!walletAddress) {
        throw new BadRequestException('Wallet address not configured');
      }

      if (!this.validateAddress(walletAddress)) {
        throw new BadRequestException(`Invalid address: ${walletAddress}`);
      }

      // Get USDT contract instance
      const contract = await this.tronWeb.contract().at(this.config.usdtContract);

      // Get balance in smallest unit
      const balanceInSmallestUnit = await contract.balanceOf(walletAddress).call();

      // Convert to USDT
      const balance = this.fromSmallestUnit(balanceInSmallestUnit.toString());

      this.logger.debug(
        `USDT balance for ${walletAddress}: ${balance} USDT`,
      );

      return {
        address: walletAddress,
        balance,
        decimals: this.USDT_DECIMALS,
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get USDT balance: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to fetch USDT balance: ${error.message}`,
      );
    }
  }

  // ========================================
  // USDT TRANSFER METHODS
  // ========================================

  /**
   * Send USDT to a recipient address
   */
  async sendUSDT(
    toAddress: string,
    amount: number,
    options?: {
      feeLimit?: number;
      note?: string;
    },
  ): Promise<SendUSDTResult> {
    const startTime = Date.now();

    try {
      // Validate recipient address
      this.validateAndConvertAddress(toAddress);

      // Validate amount
      if (amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      this.logger.log(
        `Initiating USDT transfer: ${amount} USDT to ${toAddress}`,
      );

      // Check USDT balance
      const balanceInfo = await this.getUSDTBalance();
      if (balanceInfo.balance < amount) {
        throw new BadRequestException(
          `Insufficient USDT balance. Have: ${balanceInfo.balance}, Need: ${amount}`,
        );
      }

      // Check TRX balance for gas fees
      const trxBalance = await this.getTRXBalance();
      if (trxBalance < 20) {
        // Conservative estimate
        this.logger.warn(
          `Low TRX balance: ${trxBalance} TRX. May not be sufficient for gas fees.`,
        );
      }

      // Convert amount to smallest unit
      const amountInSmallestUnit = this.toSmallestUnit(amount);

      this.logger.debug(
        `Amount in smallest unit: ${amountInSmallestUnit} (${amount} USDT)`,
      );

      // Get USDT contract
      const contract = await this.tronWeb.contract().at(this.config.usdtContract);

      // Execute transfer
      const feeLimit = options?.feeLimit || this.config.maxFeeLimit;

      this.logger.debug(
        `Executing transfer with fee limit: ${feeLimit} SUN (${this.sunToTrx(feeLimit)} TRX)`,
      );

      const txResult = await contract
        .transfer(toAddress, amountInSmallestUnit)
        .send({
          feeLimit,
          callValue: 0,
          shouldPollResponse: false, // We'll poll manually
        });

      const txHash = typeof txResult === 'string' ? txResult : txResult.txid || txResult;

      const executionTime = Date.now() - startTime;

      this.logger.log(
        `USDT transfer broadcast successful. TxHash: ${txHash}, Time: ${executionTime}ms`,
      );

      return {
        txHash,
        success: true,
        amount,
        toAddress,
        timestamp: new Date(),
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      this.logger.error(
        `USDT transfer failed after ${executionTime}ms: ${error.message}`,
        error.stack,
      );

      // Parse specific error types
      if (error.message.includes('Insufficient balance')) {
        throw new BadRequestException('Insufficient USDT balance');
      }

      if (error.message.includes('Invalid address')) {
        throw new BadRequestException('Invalid recipient address');
      }

      if (error.message.includes('bandwidth') || error.message.includes('energy')) {
        throw new InternalServerErrorException(
          'Insufficient TRX for transaction fees. Please add TRX to wallet.',
        );
      }

      throw new InternalServerErrorException(
        `USDT transfer failed: ${error.message}`,
      );
    }
  }

  // ========================================
  // TRANSACTION STATUS METHODS
  // ========================================

  /**
   * Get transaction status by transaction hash
   */
  async getTransactionStatus(txHash: string): Promise<TronTransactionStatus> {
    try {
      if (!txHash) {
        throw new BadRequestException('Transaction hash is required');
      }

      this.logger.debug(`Checking status for transaction: ${txHash}`);

      // Get transaction info
      const txInfo = await this.tronWeb.trx.getTransactionInfo(txHash);

      // If no info found, transaction might not be confirmed yet
      if (!txInfo || Object.keys(txInfo).length === 0) {
        this.logger.debug(`Transaction ${txHash} not found or not confirmed yet`);
        return {
          found: false,
          confirmed: false,
          confirmations: 0,
        };
      }

      // Get current block number
      const currentBlock = await this.tronWeb.trx.getCurrentBlock();
      const currentBlockNumber = currentBlock.block_header.raw_data.number;
      const txBlockNumber = txInfo.blockNumber;

      // Calculate confirmations
      const confirmations = currentBlockNumber - txBlockNumber;

      // Check if transaction was successful
      const success = txInfo.receipt?.result === 'SUCCESS';

      const status: TronTransactionStatus = {
        found: true,
        confirmed: confirmations >= this.config.requiredConfirmations,
        confirmations,
        blockNumber: txBlockNumber,
        success,
        energyUsed: txInfo.receipt?.energy_usage_total || 0,
        timestamp: txInfo.blockTimeStamp,
      };

      this.logger.debug(
        `Transaction ${txHash}: ${confirmations} confirmations, success: ${success}`,
      );

      return status;
    } catch (error) {
      this.logger.error(
        `Failed to get transaction status for ${txHash}: ${error.message}`,
        error.stack,
      );

      // Return not found status on error
      return {
        found: false,
        confirmed: false,
        confirmations: 0,
      };
    }
  }

  /**
   * Wait for transaction confirmation (with polling)
   */
  async waitForConfirmation(
    txHash: string,
    requiredConfirmations?: number,
    maxRetries: number = 20,
    retryInterval: number = 5000, // 5 seconds
  ): Promise<TronTransactionStatus> {
    const required = requiredConfirmations || this.config.requiredConfirmations;
    let retries = 0;

    this.logger.log(
      `Waiting for ${required} confirmations for transaction ${txHash}`,
    );

    while (retries < maxRetries) {
      const status = await this.getTransactionStatus(txHash);

      // If not found after several retries, throw error
      if (!status.found && retries > 5) {
        throw new InternalServerErrorException(
          `Transaction ${txHash} not found on blockchain after ${retries} attempts`,
        );
      }

      // If found but failed, throw error
      if (status.found && status.success === false) {
        throw new InternalServerErrorException(
          `Transaction ${txHash} failed on blockchain`,
        );
      }

      // If confirmed, return status
      if (status.confirmations >= required) {
        this.logger.log(
          `Transaction ${txHash} confirmed with ${status.confirmations} confirmations`,
        );
        return status;
      }

      // Wait before next check
      this.logger.debug(
        `Transaction ${txHash} has ${status.confirmations}/${required} confirmations. Retry ${retries + 1}/${maxRetries}`,
      );

      await this.sleep(retryInterval);
      retries++;
    }

    throw new InternalServerErrorException(
      `Transaction confirmation timeout for ${txHash} after ${maxRetries} retries`,
    );
  }

  /**
   * Helper method to sleep/delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get account information
   */
  async getAccountInfo(address?: string): Promise<any> {
    try {
      const walletAddress = address || this.config.walletAddress;

      if (!walletAddress) {
        throw new BadRequestException('Wallet address not configured');
      }

      if (!this.validateAddress(walletAddress)) {
        throw new BadRequestException(`Invalid address: ${walletAddress}`);
      }

      const account = await this.tronWeb.trx.getAccount(walletAddress);

      return {
        address: walletAddress,
        exists: !!account.address,
        balance: account.balance ? this.sunToTrx(account.balance) : 0,
        createTime: account.create_time ? new Date(account.create_time) : null,
        accountResource: account.account_resource || {},
      };
    } catch (error) {
      this.logger.error(`Failed to get account info: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to get account info: ${error.message}`,
      );
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      network: this.config.network,
      apiUrl: this.config.apiUrl,
      walletAddress: this.config.walletAddress,
      usdtContract: this.config.usdtContract,
      maxFeeLimit: this.config.maxFeeLimit,
      requiredConfirmations: this.config.requiredConfirmations,
    };
  }

  /**
   * Check connection to TRON network
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.tronWeb.trx.getCurrentBlock();
      return true;
    } catch (error) {
      this.logger.error(`Connection check failed: ${error.message}`);
      return false;
    }
  }
}
