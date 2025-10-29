import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  MpesaAccessTokenResponse,
  MpesaStkPushResponse,
  MpesaB2CResponse,
} from './interfaces/mpesa-response.interface';
import { StkPushDto, B2CDto } from './dto';

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiryTime: Date | null = null;

  // M-Pesa API URLs
  private readonly baseUrl: string;
  private readonly authUrl: string;
  private readonly stkPushUrl: string;
  private readonly b2cUrl: string;

  // M-Pesa Credentials
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly passkey: string;
  private readonly shortcode: string;
  private readonly initiatorName: string;
  private readonly initiatorPassword: string;
  private readonly environment: string;

  constructor(private configService: ConfigService) {
    this.environment = this.configService.get<string>('MPESA_ENVIRONMENT', 'sandbox');

    // Set base URLs based on environment
    if (this.environment === 'production') {
      this.baseUrl = 'https://api.safaricom.co.ke';
    } else {
      this.baseUrl = 'https://sandbox.safaricom.co.ke';
    }

    this.authUrl = `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;
    this.stkPushUrl = `${this.baseUrl}/mpesa/stkpush/v1/processrequest`;
    this.b2cUrl = `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`;

    // Get credentials from environment
    this.consumerKey = this.configService.get<string>('MPESA_CONSUMER_KEY', '');
    this.consumerSecret = this.configService.get<string>('MPESA_CONSUMER_SECRET', '');
    this.passkey = this.configService.get<string>('MPESA_PASSKEY', '');
    this.shortcode = this.configService.get<string>('MPESA_SHORTCODE', '174379');
    this.initiatorName = this.configService.get<string>('MPESA_INITIATOR_NAME', 'testapi');
    this.initiatorPassword = this.configService.get<string>('MPESA_INITIATOR_PASSWORD', '');

    // Initialize axios instance
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });

    this.logger.log(`M-Pesa Service initialized in ${this.environment} mode`);
  }

  /**
   * Get M-Pesa access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiryTime && new Date() < this.tokenExpiryTime) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

      const response = await this.axiosInstance.get<MpesaAccessTokenResponse>(this.authUrl, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      this.accessToken = response.data.access_token;

      // Token expires in 1 hour, cache for 55 minutes to be safe
      this.tokenExpiryTime = new Date(Date.now() + 55 * 60 * 1000);

      this.logger.log('M-Pesa access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get M-Pesa access token', error);
      throw new BadRequestException('Failed to authenticate with M-Pesa');
    }
  }

  /**
   * Generate password for STK Push
   */
  private generateStkPassword(timestamp: string): string {
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
    return password;
  }

  /**
   * Generate timestamp in M-Pesa format (YYYYMMDDHHmmss)
   */
  private generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Format phone number to M-Pesa format (254XXXXXXXXX)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove + if present
    let formatted = phoneNumber.replace('+', '');

    // If starts with 0, replace with 254
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1);
    }

    return formatted;
  }

  /**
   * Initiate STK Push (Lipa Na M-Pesa Online)
   * Used for collecting payments from customers
   */
  async stkPush(stkPushDto: StkPushDto, transactionId: string): Promise<MpesaStkPushResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generateStkPassword(timestamp);
      const phoneNumber = this.formatPhoneNumber(stkPushDto.phoneNumber);
      const callbackUrl = this.configService.get<string>('MPESA_CALLBACK_URL');

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.floor(stkPushDto.amount), // M-Pesa requires integer
        PartyA: phoneNumber, // Customer phone
        PartyB: this.shortcode, // Business shortcode
        PhoneNumber: phoneNumber,
        CallBackURL: `${callbackUrl}/mpesa/callback/stk`,
        AccountReference: stkPushDto.accountReference,
        TransactionDesc: stkPushDto.transactionDesc,
      };

      this.logger.log(`Initiating STK Push for transaction ${transactionId}`);

      const response = await this.axiosInstance.post<MpesaStkPushResponse>(
        this.stkPushUrl,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`STK Push initiated: ${response.data.CheckoutRequestID}`);
      return response.data;
    } catch (error: any) {
      this.logger.error('STK Push failed', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment',
      );
    }
  }

  /**
   * Generate security credential for B2C
   */
  private generateSecurityCredential(): string {
    // In production, this should encrypt the initiator password with M-Pesa public key
    // For sandbox, we can use the plain password
    if (this.environment === 'sandbox') {
      return this.initiatorPassword;
    }

    // TODO: Implement proper encryption for production
    // This requires the M-Pesa public certificate
    return this.initiatorPassword;
  }

  /**
   * Initiate B2C Payment (Business to Customer)
   * Used for sending money to customers (payouts)
   */
  async b2cPayment(b2cDto: B2CDto, transactionId: string): Promise<MpesaB2CResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const phoneNumber = this.formatPhoneNumber(b2cDto.phoneNumber);
      const securityCredential = this.generateSecurityCredential();
      const callbackUrl = this.configService.get<string>('MPESA_CALLBACK_URL');

      const payload = {
        InitiatorName: this.initiatorName,
        SecurityCredential: securityCredential,
        CommandID: b2cDto.commandId,
        Amount: Math.floor(b2cDto.amount),
        PartyA: this.shortcode, // Business shortcode
        PartyB: phoneNumber, // Customer phone
        Remarks: b2cDto.remarks,
        QueueTimeOutURL: `${callbackUrl}/mpesa/callback/b2c/timeout`,
        ResultURL: `${callbackUrl}/mpesa/callback/b2c/result`,
        Occasion: b2cDto.occasion,
      };

      this.logger.log(`Initiating B2C payment for transaction ${transactionId}`);

      const response = await this.axiosInstance.post<MpesaB2CResponse>(
        this.b2cUrl,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`B2C payment initiated: ${response.data.ConversationID}`);
      return response.data;
    } catch (error: any) {
      this.logger.error('B2C payment failed', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.errorMessage || 'Failed to initiate B2C payment',
      );
    }
  }

  /**
   * Query STK Push transaction status
   */
  async queryStkPushStatus(checkoutRequestId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generateStkPassword(timestamp);

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const queryUrl = `${this.baseUrl}/mpesa/stkpushquery/v1/query`;

      const response = await this.axiosInstance.post(queryUrl, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      this.logger.error('STK Push query failed', error.response?.data || error.message);
      throw new BadRequestException('Failed to query transaction status');
    }
  }
}
