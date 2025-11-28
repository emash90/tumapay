import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpConfig = this.configService.get('smtp');

    if (!smtpConfig?.auth?.user || !smtpConfig?.auth?.pass) {
      this.logger.warn(
        'SMTP credentials not configured. Email sending will be disabled.',
      );
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: {
          user: smtpConfig.auth.user,
          pass: smtpConfig.auth.pass,
        },
      });

      this.logger.log(`Email service initialized with host: ${smtpConfig.host}`);
    } catch (error) {
      this.logger.error('Failed to initialize email transporter', error);
    }
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not initialized. Skipping email send.');
      return false;
    }

    const smtpConfig = this.configService.get('smtp');
    const fromEmail = smtpConfig?.from?.email || smtpConfig?.auth?.user;
    const fromName = smtpConfig?.from?.name || 'TumaPay';

    try {
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      this.logger.log(`Email sent to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      return false;
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    // Direct API call - backend handles verification and redirects to frontend
    const verificationUrl = `${this.configService.get('app.appUrl')}/api/v1/auth/verify-email-redirect?token=${token}`;

    const html = this.getVerificationEmailTemplate(verificationUrl);
    const text = `Welcome to TumaPay! Please verify your email address by clicking the link: ${verificationUrl}`;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - TumaPay',
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${this.configService.get('app.frontendUrl')}/reset-password?token=${token}`;

    const html = this.getPasswordResetEmailTemplate(resetUrl);
    const text = `You requested a password reset. Click the link to reset your password: ${resetUrl}`;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - TumaPay',
      html,
      text,
    });
  }

  /**
   * Send 2FA code email
   */
  async send2FACodeEmail(email: string, code: string): Promise<boolean> {
    const html = this.get2FACodeEmailTemplate(code);
    const text = `Your TumaPay verification code is: ${code}`;

    return this.sendEmail({
      to: email,
      subject: 'Your Verification Code - TumaPay',
      html,
      text,
    });
  }

  /**
   * Send transfer success notification
   */
  async sendTransferSuccessEmail(
    email: string,
    data: {
      recipientName: string;
      amount: number;
      currency: string;
      reference: string;
      timestamp: Date;
    },
  ): Promise<boolean> {
    const html = this.getTransferSuccessTemplate(data);
    const text = `Transfer successful! ${data.amount} ${data.currency} sent to ${data.recipientName}. Reference: ${data.reference}`;

    return this.sendEmail({
      to: email,
      subject: 'Transfer Successful - TumaPay',
      html,
      text,
    });
  }

  /**
   * Send transfer failure notification
   */
  async sendTransferFailureEmail(
    email: string,
    data: {
      recipientName: string;
      amount: number;
      currency: string;
      reference: string;
      reason: string;
      timestamp: Date;
    },
  ): Promise<boolean> {
    const html = this.getTransferFailureTemplate(data);
    const text = `Transfer failed. ${data.amount} ${data.currency} to ${data.recipientName} could not be completed. Reason: ${data.reason}. Reference: ${data.reference}`;

    return this.sendEmail({
      to: email,
      subject: 'Transfer Failed - TumaPay',
      html,
      text,
    });
  }

  /**
   * Send payment received notification
   */
  async sendPaymentReceivedEmail(
    email: string,
    data: {
      senderName: string;
      amount: number;
      currency: string;
      reference: string;
      timestamp: Date;
    },
  ): Promise<boolean> {
    const html = this.getPaymentReceivedTemplate(data);
    const text = `Payment received! ${data.amount} ${data.currency} from ${data.senderName}. Reference: ${data.reference}`;

    return this.sendEmail({
      to: email,
      subject: 'Payment Received - TumaPay',
      html,
      text,
    });
  }

  // Email Templates

  private getVerificationEmailTemplate(verificationUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #4F46E5; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Welcome to TumaPay!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Verify Your Email Address</h2>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                Thank you for signing up with TumaPay. To complete your registration and start using our services, please verify your email address by clicking the button below.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 15px 40px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">Verify Email</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; color: #4F46E5; font-size: 14px; word-break: break-all;">
                ${verificationUrl}
              </p>
              <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                This verification link will expire in 24 hours. If you didn't create an account with TumaPay, please ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 14px;">
                © ${new Date().getFullYear()} TumaPay. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private getPasswordResetEmailTemplate(resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #4F46E5; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Password Reset</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Reset Your Password</h2>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                We received a request to reset your password for your TumaPay account. Click the button below to create a new password.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 15px 40px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; color: #4F46E5; font-size: 14px; word-break: break-all;">
                ${resetUrl}
              </p>
              <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                This password reset link will expire in 24 hours. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 14px;">
                © ${new Date().getFullYear()} TumaPay. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private get2FACodeEmailTemplate(code: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #4F46E5; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Verification Code</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Your Two-Factor Authentication Code</h2>
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5;">
                Use this code to complete your login:
              </p>
              <div style="display: inline-block; padding: 20px 40px; background-color: #f0f0f0; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 36px; font-weight: bold; color: #4F46E5; letter-spacing: 8px;">${code}</span>
              </div>
              <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                This code will expire in 10 minutes. If you didn't request this code, please ignore this email or contact support.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 14px;">
                © ${new Date().getFullYear()} TumaPay. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private getTransferSuccessTemplate(data: {
    recipientName: string;
    amount: number;
    currency: string;
    reference: string;
    timestamp: Date;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transfer Successful</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #10B981; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">✓ Transfer Successful</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Payment Sent Successfully</h2>
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5;">
                Your transfer has been processed successfully.
              </p>
              <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f9f9f9; border-radius: 6px;">
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 15px;">Recipient</td>
                  <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right; padding: 15px;">${data.recipientName}</td>
                </tr>
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 15px;">Amount</td>
                  <td style="color: #10B981; font-size: 18px; font-weight: bold; text-align: right; padding: 15px;">${data.amount.toLocaleString()} ${data.currency}</td>
                </tr>
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 15px;">Reference</td>
                  <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right; padding: 15px;">${data.reference}</td>
                </tr>
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 15px;">Date & Time</td>
                  <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right; padding: 15px;">${data.timestamp.toLocaleString()}</td>
                </tr>
              </table>
              <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                The funds will be available to the recipient shortly. Keep this reference number for your records.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 14px;">
                © ${new Date().getFullYear()} TumaPay. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private getTransferFailureTemplate(data: {
    recipientName: string;
    amount: number;
    currency: string;
    reference: string;
    reason: string;
    timestamp: Date;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transfer Failed</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #EF4444; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Transfer Failed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Payment Could Not Be Processed</h2>
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5;">
                We were unable to process your transfer. Please review the details below.
              </p>
              <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f9f9f9; border-radius: 6px;">
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 15px;">Recipient</td>
                  <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right; padding: 15px;">${data.recipientName}</td>
                </tr>
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 15px;">Amount</td>
                  <td style="color: #333333; font-size: 18px; font-weight: bold; text-align: right; padding: 15px;">${data.amount.toLocaleString()} ${data.currency}</td>
                </tr>
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 15px;">Reference</td>
                  <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right; padding: 15px;">${data.reference}</td>
                </tr>
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 15px;">Reason</td>
                  <td style="color: #EF4444; font-size: 14px; font-weight: bold; text-align: right; padding: 15px;">${data.reason}</td>
                </tr>
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 15px;">Date & Time</td>
                  <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right; padding: 15px;">${data.timestamp.toLocaleString()}</td>
                </tr>
              </table>
              <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                No funds have been deducted from your account. Please try again or contact our support team if the issue persists.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 14px;">
                © ${new Date().getFullYear()} TumaPay. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private getPaymentReceivedTemplate(data: {
    senderName: string;
    amount: number;
    currency: string;
    reference: string;
    timestamp: Date;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #10B981; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">✓ Payment Received</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">You've Received a Payment</h2>
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5;">
                Great news! A payment has been credited to your TumaPay account.
              </p>
              <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f9f9f9; border-radius: 6px;">
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 15px;">From</td>
                  <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right; padding: 15px;">${data.senderName}</td>
                </tr>
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 15px;">Amount</td>
                  <td style="color: #10B981; font-size: 18px; font-weight: bold; text-align: right; padding: 15px;">${data.amount.toLocaleString()} ${data.currency}</td>
                </tr>
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 15px;">Reference</td>
                  <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right; padding: 15px;">${data.reference}</td>
                </tr>
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 15px;">Date & Time</td>
                  <td style="color: #333333; font-size: 14px; font-weight: bold; text-align: right; padding: 15px;">${data.timestamp.toLocaleString()}</td>
                </tr>
              </table>
              <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                The funds are now available in your account. Log in to view your updated balance.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 14px;">
                © ${new Date().getFullYear()} TumaPay. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}
