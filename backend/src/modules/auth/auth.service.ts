import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { User } from '../../database/entities/user.entity';
import { Account } from '../../database/entities/account.entity';
import { Verification, VerificationType } from '../../database/entities/verification.entity';
import { SignUpDto, SignInDto, ResetPasswordDto, ForgotPasswordDto, ChangePasswordDto } from './dto';
import { SessionService } from './session.service';
import { BusinessService } from '../business/business.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { AuditEventType } from '../../database/entities/audit-log.entity';
import type { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private sessionService: SessionService,
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
    private businessService: BusinessService,
    private emailService: EmailService,
    private auditService: AuditService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register a new user with business
   */
  async signUp(signUpDto: SignUpDto) {
    const { email, password, firstName, lastName, phoneNumber, business } = signUpDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create business (validates KRA PIN and registration number uniqueness)
    const createdBusiness = await this.businessService.createBusiness(business);

    // Create user (new users are not super admins by default)
    const user = this.userRepository.create({
      email,
      firstName,
      lastName,
      phoneNumber,
      isSuperAdmin: false,
      emailVerified: false,
      businessId: createdBusiness.id, // Link business to user
    });

    const savedUser = await this.userRepository.save(user);

    // Hash password and create account
    const hashedPassword = await this.hashPassword(password);
    const account = this.accountRepository.create({
      userId: savedUser.id,
      providerId: 'email',
      providerAccountId: email,
      password: hashedPassword,
    });

    await this.accountRepository.save(account);

    // Generate email verification token
    const verificationToken = await this.createVerificationToken(
      email,
      VerificationType.EMAIL_VERIFICATION,
    );

    // Send verification email
    await this.emailService.sendVerificationEmail(email, verificationToken);

    return {
      success: true,
      message: 'User and business registered successfully. Please check your email to verify your account.',
      data: {
        user: this.sanitizeUser(savedUser),
        business: {
          id: createdBusiness.id,
          businessName: createdBusiness.businessName,
          registrationNumber: createdBusiness.registrationNumber,
          country: createdBusiness.country,
          kybStatus: createdBusiness.kybStatus,
          tier: createdBusiness.tier,
          dailyLimit: createdBusiness.dailyLimit,
          monthlyLimit: createdBusiness.monthlyLimit,
        },
      },
    };
  }

  /**
   * Sign in user
   */
  async signIn(signInDto: SignInDto, ipAddress?: string, userAgent?: string) {
    const { email, password } = signInDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Find account
    const account = await this.accountRepository.findOne({
      where: { userId: user.id, providerId: 'email' },
    });

    if (!account || !account.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, account.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before signing in. Check your inbox or request a new verification email.');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate 6-digit code
      const code = this.generate2FACode();

      // Store in verification table with 10-minute expiration
      await this.createVerificationToken(
        user.email,
        VerificationType.TWO_FACTOR_AUTH,
        code,
        10,
      );

      // Send email
      await this.emailService.send2FACodeEmail(user.email, code);

      // Log audit event
      await this.auditService.log({
        userId: user.id,
        email: user.email,
        eventType: AuditEventType.TWO_FACTOR_CODE_SENT,
        ipAddress,
        userAgent,
        description: '2FA code sent to email',
        success: true,
      });

      // Return 2FA required response (NO SESSION YET)
      return {
        success: true,
        requires2FA: true,
        email: user.email,
        message: 'Verification code sent to your email',
        data: null,
      };
    }

    // Create session using SessionService (for backwards compatibility and tracking)
    const session = await this.sessionService.createSession(
      user.id,
      ipAddress,
      userAgent,
    );

    // Generate JWT tokens
    const accessToken = await this.generateAccessToken(user, session.id);
    const refreshToken = await this.generateRefreshToken(user, session.id);

    // Calculate refresh token expiry
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshToken.expiresIn') || '30d';
    const expiresInMs = this.parseExpiration(refreshExpiresIn);
    const refreshTokenExpiresAt = new Date(Date.now() + expiresInMs);

    // Store refresh token in account entity
    account.refreshToken = refreshToken;
    account.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await this.accountRepository.save(account);

    // Update last login
    user.lastLoginAt = new Date();
    user.lastLoginIp = ipAddress || null;
    user.lastLoginUserAgent = userAgent || null;
    const updatedUser = await this.userRepository.save(user);

    // Fetch user's business
    const business = await this.businessService.getBusinessByUserId(user.id);

    return {
      success: true,
      message: 'Signed in successfully',
      data: {
        accessToken,
        refreshToken,
        user: this.sanitizeUser(updatedUser),
        business: business ? {
          id: business.id,
          businessName: business.businessName,
          registrationNumber: business.registrationNumber,
          country: business.country,
          kybStatus: business.kybStatus,
          tier: business.tier,
          dailyLimit: business.dailyLimit,
          monthlyLimit: business.monthlyLimit,
        } : null,
        // Keep session data for backwards compatibility
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
      },
    };
  }

  /**
   * Sign out user
   */
  async signOut(token: string) {
    await this.sessionService.invalidateSession(token);

    return {
      success: true,
      message: 'Signed out successfully',
    };
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string) {
    const verification = await this.verificationRepository.findOne({
      where: {
        token,
        type: VerificationType.EMAIL_VERIFICATION,
        isUsed: false,
      },
    });

    if (!verification) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Check if token is expired
    if (new Date() > new Date(verification.expiresAt)) {
      throw new BadRequestException('Verification token has expired');
    }

    // Find user and update email verified status
    const user = await this.userRepository.findOne({
      where: { email: verification.identifier },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user's emailVerified field
    user.emailVerified = true;
    const updatedUser = await this.userRepository.save(user);

    // Mark verification as used
    await this.verificationRepository.update(verification.id, {
      isUsed: true,
      usedAt: new Date(),
    });

    return {
      success: true,
      message: 'Email verified successfully',
      data: {
        user: this.sanitizeUser(updatedUser),
      },
    };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        success: true,
        message: 'If the email exists and is not verified, a verification link has been sent',
      };
    }

    // Check if email is already verified
    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Invalidate old verification tokens for this email
    await this.verificationRepository.update(
      {
        identifier: email,
        type: VerificationType.EMAIL_VERIFICATION,
        isUsed: false,
      },
      {
        isUsed: true,
        usedAt: new Date(),
      },
    );

    // Generate new verification token
    const verificationToken = await this.createVerificationToken(
      email,
      VerificationType.EMAIL_VERIFICATION,
    );

    // Send verification email
    await this.emailService.sendVerificationEmail(email, verificationToken);

    return {
      success: true,
      message: 'Verification email has been sent. Please check your inbox.',
    };
  }

  /**
   * Forgot password
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Log failed attempt (email not found)
      await this.auditService.log({
        email,
        eventType: AuditEventType.PASSWORD_RESET_REQUESTED,
        description: 'Password reset requested for non-existent email',
        success: false,
      });

      // Don't reveal if user exists or not
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    // Generate password reset token
    const resetToken = await this.createVerificationToken(
      email,
      VerificationType.PASSWORD_RESET,
    );

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(email, resetToken);

    // Log successful password reset request
    await this.auditService.log({
      userId: user.id,
      email: user.email,
      eventType: AuditEventType.PASSWORD_RESET_REQUESTED,
      description: 'Password reset email sent successfully',
      success: true,
    });

    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  /**
   * Reset password
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    const verification = await this.verificationRepository.findOne({
      where: {
        token,
        type: VerificationType.PASSWORD_RESET,
        isUsed: false,
      },
    });

    if (!verification) {
      // Log failed attempt - invalid token
      await this.auditService.log({
        eventType: AuditEventType.PASSWORD_RESET_FAILED,
        description: 'Password reset attempted with invalid token',
        success: false,
        metadata: { reason: 'Invalid or already used token' },
      });

      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (new Date() > new Date(verification.expiresAt)) {
      // Log failed attempt - expired token
      await this.auditService.log({
        email: verification.identifier,
        eventType: AuditEventType.PASSWORD_RESET_FAILED,
        description: 'Password reset attempted with expired token',
        success: false,
        metadata: {
          reason: 'Token expired',
          expiresAt: verification.expiresAt,
        },
      });

      throw new BadRequestException('Reset token has expired');
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: { email: verification.identifier },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find and update account password
    const account = await this.accountRepository.findOne({
      where: { userId: user.id, providerId: 'email' },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const hashedPassword = await this.hashPassword(password);
    await this.accountRepository.update(account.id, {
      password: hashedPassword,
    });

    // Mark verification as used
    await this.verificationRepository.update(verification.id, {
      isUsed: true,
      usedAt: new Date(),
    });

    // Invalidate all existing sessions for security
    await this.sessionService.invalidateAllUserSessions(user.id);

    // Send confirmation email
    await this.emailService.sendPasswordResetConfirmationEmail(user.email);

    // Log successful password reset
    await this.auditService.log({
      userId: user.id,
      email: user.email,
      eventType: AuditEventType.PASSWORD_RESET_COMPLETED,
      description: 'Password reset completed successfully',
      success: true,
      metadata: {
        sessionsInvalidated: true,
        confirmationEmailSent: true,
      },
    });

    return {
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    };
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find account
    const account = await this.accountRepository.findOne({
      where: { userId: user.id, providerId: 'email' },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Verify current password
    const isPasswordValid = await this.verifyPassword(currentPassword, account.password);

    if (!isPasswordValid) {
      throw new BadRequestException('The current password you entered is incorrect. Please try again.');
    }

    // Check if new password is different from current
    const isSamePassword = await this.verifyPassword(newPassword, account.password);

    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash new password and update
    const hashedPassword = await this.hashPassword(newPassword);
    await this.accountRepository.update(account.id, {
      password: hashedPassword,
    });

    return {
      success: true,
      data: {
        message: 'Password changed successfully',
      },
    };
  }

  /**
   * Verify 2FA code and complete sign-in
   */
  async verify2FACode(
    email: string,
    code: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Validate code from verification table
    const verification = await this.verificationRepository.findOne({
      where: {
        identifier: email,
        token: code,
        type: VerificationType.TWO_FACTOR_AUTH,
        isUsed: false,
      },
    });

    if (!verification) {
      // Audit failed attempt
      await this.auditService.log({
        email,
        eventType: AuditEventType.TWO_FACTOR_FAILED,
        success: false,
        ipAddress,
        userAgent,
        metadata: { reason: 'Invalid code' },
        description: '2FA verification failed - invalid code',
      });
      throw new UnauthorizedException('Invalid verification code');
    }

    // Check if code is expired
    if (new Date() > new Date(verification.expiresAt)) {
      await this.auditService.log({
        email,
        eventType: AuditEventType.TWO_FACTOR_FAILED,
        success: false,
        ipAddress,
        userAgent,
        metadata: { reason: 'Expired code', expiresAt: verification.expiresAt },
        description: '2FA verification failed - expired code',
      });
      throw new UnauthorizedException('Verification code has expired');
    }

    // Mark as used
    verification.isUsed = true;
    verification.usedAt = new Date();
    await this.verificationRepository.save(verification);

    // Get user
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find account for refresh token storage
    const account = await this.accountRepository.findOne({
      where: { userId: user.id, providerId: 'email' },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // NOW create session and issue tokens
    const session = await this.sessionService.createSession(
      user.id,
      ipAddress,
      userAgent,
    );

    // Generate JWT tokens
    const accessToken = await this.generateAccessToken(user, session.id);
    const refreshToken = await this.generateRefreshToken(user, session.id);

    // Calculate refresh token expiry
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshToken.expiresIn') || '30d';
    const expiresInMs = this.parseExpiration(refreshExpiresIn);
    const refreshTokenExpiresAt = new Date(Date.now() + expiresInMs);

    // Store refresh token in account entity
    account.refreshToken = refreshToken;
    account.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await this.accountRepository.save(account);

    // Update last login
    user.lastLoginAt = new Date();
    user.lastLoginIp = ipAddress || null;
    user.lastLoginUserAgent = userAgent || null;
    const updatedUser = await this.userRepository.save(user);

    // Fetch user's business
    const business = await this.businessService.getBusinessByUserId(user.id);

    // Audit success
    await this.auditService.log({
      userId: user.id,
      email,
      eventType: AuditEventType.TWO_FACTOR_SUCCESS,
      ipAddress,
      userAgent,
      description: '2FA verification successful',
      success: true,
    });

    return {
      success: true,
      message: 'Signed in successfully',
      data: {
        accessToken,
        refreshToken,
        user: this.sanitizeUser(updatedUser),
        business: business ? {
          id: business.id,
          businessName: business.businessName,
          registrationNumber: business.registrationNumber,
          country: business.country,
          kybStatus: business.kybStatus,
          tier: business.tier,
          dailyLimit: business.dailyLimit,
          monthlyLimit: business.monthlyLimit,
        } : null,
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
      },
    };
  }

  /**
   * Resend 2FA code
   */
  async resend2FACode(email: string) {
    // Find user
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists
      return {
        success: true,
        message: 'If the email exists, a new verification code has been sent',
      };
    }

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled for this account');
    }

    // Invalidate old codes (mark as used)
    await this.verificationRepository.update(
      {
        identifier: email,
        type: VerificationType.TWO_FACTOR_AUTH,
        isUsed: false,
      },
      { isUsed: true, usedAt: new Date() },
    );

    // Generate new code
    const code = this.generate2FACode();

    // Store in verification table
    await this.createVerificationToken(
      email,
      VerificationType.TWO_FACTOR_AUTH,
      code,
      10,
    );

    // Send email
    await this.emailService.send2FACodeEmail(email, code);

    // Audit event
    await this.auditService.log({
      userId: user.id,
      email,
      eventType: AuditEventType.TWO_FACTOR_CODE_SENT,
      description: '2FA code resent',
      success: true,
    });

    return {
      success: true,
      message: 'A new verification code has been sent to your email',
    };
  }

  /**
   * Toggle 2FA for authenticated user
   */
  async toggle2FA(userId: string, enabled: boolean) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update 2FA status
    user.twoFactorEnabled = enabled;
    await this.userRepository.save(user);

    // Audit event
    await this.auditService.log({
      userId: user.id,
      email: user.email,
      eventType: enabled ? AuditEventType.TWO_FACTOR_ENABLED : AuditEventType.TWO_FACTOR_DISABLED,
      description: enabled ? '2FA enabled' : '2FA disabled',
      success: true,
    });

    return {
      success: true,
      message: enabled ? '2FA has been enabled' : '2FA has been disabled',
      data: {
        twoFactorEnabled: enabled,
      },
    };
  }

  /**
   * Get current user session
   */
  async getSession(token: string) {
    const session = await this.sessionService.getSession(token);

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return {
      success: true,
      data: {
        user: this.sanitizeUser(session.user),
        session: {
          expiresAt: session.expiresAt,
          createdAt: session.createdAt,
        },
      },
    };
  }

  // Helper methods

  private async hashPassword(password: string): Promise<string> {
    // Using crypto.pbkdf2 for password hashing
    // In production, consider using bcrypt or argon2
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt + ':' + derivedKey.toString('hex'));
      });
    });
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [salt, key] = hash.split(':');
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(key === derivedKey.toString('hex'));
      });
    });
  }

  private async createVerificationToken(
    identifier: string,
    type: VerificationType,
    customToken?: string,
    expirationMinutes?: number,
  ): Promise<string> {
    const token = customToken || crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();

    // Use custom expiration or default based on type
    if (expirationMinutes) {
      expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);
    } else if (type === VerificationType.TWO_FACTOR_AUTH) {
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes for 2FA
    } else {
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours for others
    }

    const verification = this.verificationRepository.create({
      identifier,
      token,
      type,
      expiresAt,
    });

    await this.verificationRepository.save(verification);
    return token;
  }

  private sanitizeUser(user: User) {
    const {
      twoFactorSecret,
      twoFactorBackupCodes,
      ...sanitized
    } = user;
    return sanitized;
  }

  /**
   * Generate 6-digit 2FA code
   */
  private generate2FACode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate JWT access token (short-lived, 30 minutes)
   */
  async generateAccessToken(user: User, sessionId?: string): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      sessionId,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Generate JWT refresh token (long-lived, 30 days)
   */
  async generateRefreshToken(user: User, sessionId?: string): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      sessionId,
    };

    const refreshSecret = this.configService.get<string>('jwt.refreshToken.secret') || 'default-refresh-secret';
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshToken.expiresIn') || '30d';

    return this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as any,
    });
  }

  /**
   * Verify and decode refresh token
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const refreshSecret = this.configService.get<string>('jwt.refreshToken.secret') || 'default-refresh-secret';
      return this.jwtService.verify<JwtPayload>(token, { secret: refreshSecret });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string) {
    // Verify refresh token
    const payload = await this.verifyRefreshToken(refreshToken);

    // Find user and account
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['business'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const account = await this.accountRepository.findOne({
      where: { userId: user.id, providerId: 'email' },
    });

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    // Verify that the refresh token matches the stored one
    if (account.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if refresh token has expired
    if (account.refreshTokenExpiresAt && new Date() > account.refreshTokenExpiresAt) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Generate new tokens
    const newAccessToken = await this.generateAccessToken(user, payload.sessionId);
    const newRefreshToken = await this.generateRefreshToken(user, payload.sessionId);

    // Calculate new expiry
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshToken.expiresIn') || '30d';
    const expiresInMs = this.parseExpiration(refreshExpiresIn);
    const newRefreshTokenExpiresAt = new Date(Date.now() + expiresInMs);

    // Update refresh token in database (token rotation)
    account.refreshToken = newRefreshToken;
    account.refreshTokenExpiresAt = newRefreshTokenExpiresAt;
    await this.accountRepository.save(account);

    // Fetch business
    const business = await this.businessService.getBusinessByUserId(user.id);

    return {
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: this.sanitizeUser(user),
        business: business ? {
          id: business.id,
          businessName: business.businessName,
          registrationNumber: business.registrationNumber,
          country: business.country,
          kybStatus: business.kybStatus,
          tier: business.tier,
          dailyLimit: business.dailyLimit,
          monthlyLimit: business.monthlyLimit,
        } : null,
      },
    };
  }

  /**
   * Parse expiration string (e.g., '30m', '7d') to milliseconds
   */
  private parseExpiration(expiration: string): number {
    const units: { [key: string]: number } = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiration format: ${expiration}`);
    }

    const [, value, unit] = match;
    return parseInt(value, 10) * units[unit];
  }
}
