import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
const TronWeb = require('tronweb');
import tronConfig from '../../config/tron.config';

@Injectable()
export class TronService {
  private readonly logger = new Logger(TronService.name);
  private tronWeb: any;

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
}
