import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  UseGuards,
  Res,
  Req,
  UnauthorizedException,
  Query,
  Redirect,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import {
  SignUpDto,
  SignInDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { User } from '../../database/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account with email and password',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Public()
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in with email and password',
    description: 'Authenticate user and create a new session. Returns access token in response body and sets refresh token in httpOnly cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Signed in successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async signIn(
    @Body() signInDto: SignInDto,
    @Ip() ipAddress: string,
    @Headers() headers?: Record<string, string>,
    @Res({ passthrough: true }) response?: Response,
  ) {
    const userAgent = headers?.['user-agent'] || headers?.['User-Agent'] || 'unknown';
    const result = await this.authService.signIn(signInDto, ipAddress, userAgent);

    // Set refresh token in httpOnly cookie
    if (result.data.refreshToken && response) {
      const cookieOptions = this.configService.get('jwt.cookie');
      response.cookie(cookieOptions.name, result.data.refreshToken, {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge,
        path: cookieOptions.path,
      });

      // Remove refresh token from response body (only send access token)
      const { refreshToken: _, ...dataWithoutRefreshToken } = result.data;
      return {
        ...result,
        data: dataWithoutRefreshToken,
      };
    }

    return result;
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Sign out current session',
    description: 'Invalidate the current user session and clear refresh token cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'Signed out successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async signOut(
    @Headers('authorization') authorization: string,
    @Res({ passthrough: true }) response?: Response,
  ) {
    const token = authorization?.replace('Bearer ', '');
    const result = await this.authService.signOut(token);

    // Clear the refresh token cookie
    if (response) {
      const cookieName = this.configService.get('jwt.cookie.name') || 'refreshToken';
      response.clearCookie(cookieName, {
        httpOnly: true,
        secure: this.configService.get('jwt.cookie.secure'),
        sameSite: this.configService.get('jwt.cookie.sameSite'),
        path: this.configService.get('jwt.cookie.path') || '/',
      });
    }

    return result;
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verify user email with the token sent to their email',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification token',
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto.token);
  }

  @Public()
  @Get('verify-email-redirect')
  @ApiOperation({
    summary: 'Verify email and redirect to frontend',
    description: 'Verify user email with token from email link and redirect to login page',
  })
  async verifyEmailRedirect(
    @Query('token') token: string,
    @Res() response: Response,
  ) {
    try {
      await this.authService.verifyEmail(token);
      // Redirect to frontend login page with success message
      const frontendUrl = this.configService.get<string>('app.frontendUrl') || 'http://localhost:5173';
      return response.redirect(`${frontendUrl}/login?verified=true`);
    } catch (error) {
      // Redirect to frontend with error
      const frontendUrl = this.configService.get<string>('app.frontendUrl') || 'http://localhost:5173';
      return response.redirect(`${frontendUrl}/login?verified=false&error=${encodeURIComponent(error.message)}`);
    }
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend email verification',
    description: 'Resend verification email to the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Email is already verified',
  })
  async resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(resendVerificationDto.email);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset link to user email',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset link sent (if email exists)',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Reset user password using the reset token',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset token',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Change password for authenticated user',
    description: 'Change password by providing current password and new password',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Current password is incorrect or new password must be different from current password',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using the refresh token from httpOnly cookie. Returns new access token and sets new refresh token in cookie (token rotation).',
  })
  @ApiCookieAuth('refreshToken')
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response?: Response,
  ) {
    const cookieName = this.configService.get('jwt.cookie.name') || 'refreshToken';
    const refreshToken = request.cookies?.[cookieName];

    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token not found in cookies. Please sign in again.'
      );
    }

    const result = await this.authService.refreshTokens(refreshToken);

    // Set new refresh token in httpOnly cookie (token rotation)
    if (result.data.refreshToken && response) {
      const cookieOptions = this.configService.get('jwt.cookie');
      response.cookie(cookieOptions.name, result.data.refreshToken, {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge,
        path: cookieOptions.path,
      });

      // Remove refresh token from response body (only send access token)
      const { refreshToken: _, ...dataWithoutRefreshToken } = result.data;
      return {
        ...result,
        data: dataWithoutRefreshToken,
      };
    }

    return result;
  }

  @Get('session')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Get current session',
    description: 'Retrieve information about the current authenticated session',
  })
  @ApiResponse({
    status: 200,
    description: 'Session retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getSession(
    @CurrentUser() user: User,
    @Req() request: Request,
  ) {
    // For JWT auth, we don't have a traditional session object
    // Return user info and auth type
    const authType = (request as any).authType || 'jwt';
    const session = (request as any).session;

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
          isActive: user.isActive,
        },
        session: session ? {
          expiresAt: session.expiresAt,
          createdAt: session.createdAt,
        } : null,
        authType,
      },
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Retrieve currently authenticated user information',
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getCurrentUser(@CurrentUser() user: User) {
    return {
      success: true,
      data: { user },
    };
  }
}
