import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User, UserRole } from '../../database/entities/user.entity';
import { Account } from '../../database/entities/account.entity';
import { Session } from '../../database/entities/session.entity';
import { Verification, VerificationType } from '../../database/entities/verification.entity';
import { SignUpDto, SignInDto, ResetPasswordDto, ForgotPasswordDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
  ) {}

  /**
   * Register a new user
   */
  async signUp(signUpDto: SignUpDto) {
    const { email, password, firstName, lastName, phoneNumber } = signUpDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user
    const user = this.userRepository.create({
      email,
      firstName,
      lastName,
      phoneNumber,
      role: UserRole.BUSINESS_STAFF,
      emailVerified: false,
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

    // TODO: Send verification email
    console.log(`Verification token for ${email}: ${verificationToken}`);

    return {
      success: true,
      message: 'User registered successfully. Please verify your email.',
      data: {
        user: this.sanitizeUser(savedUser),
        verificationToken, // Remove this in production
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

    // Check if email is verified (optional - you can enforce this)
    // if (!user.emailVerified) {
    //   throw new UnauthorizedException('Please verify your email before signing in');
    // }

    // Create session
    const session = await this.createSession(user.id, ipAddress, userAgent);

    // Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
      lastLoginUserAgent: userAgent,
    });

    return {
      success: true,
      message: 'Signed in successfully',
      data: {
        user: this.sanitizeUser(user),
        session: {
          token: session.token,
          expiresAt: session.expiresAt,
        },
      },
    };
  }

  /**
   * Sign out user
   */
  async signOut(token: string) {
    const session = await this.sessionRepository.findOne({
      where: { token },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Deactivate session
    await this.sessionRepository.update(session.id, {
      isActive: false,
    });

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
   * Forgot password
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
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

    // TODO: Send password reset email
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent',
      data: {
        resetToken, // Remove this in production
      },
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
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (new Date() > new Date(verification.expiresAt)) {
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
    await this.sessionRepository.update(
      { userId: user.id },
      { isActive: false },
    );

    return {
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    };
  }

  /**
   * Get current user session
   */
  async getSession(token: string) {
    const session = await this.sessionRepository.findOne({
      where: { token, isActive: true },
      relations: ['user', 'user.business'],
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    if (new Date() > new Date(session.expiresAt)) {
      throw new UnauthorizedException('Session has expired');
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

  private async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Session> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const session = this.sessionRepository.create({
      userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return this.sessionRepository.save(session);
  }

  private async createVerificationToken(
    identifier: string,
    type: VerificationType,
  ): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

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
}
