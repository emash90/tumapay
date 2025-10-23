import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SessionService } from './session.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { User } from '../../database/entities/user.entity';

@ApiTags('sessions')
@Controller('auth/sessions')
@UseGuards(AuthGuard)
@ApiBearerAuth('bearer')
export class SessionController {
  constructor(private sessionService: SessionService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all active sessions',
    description: 'Retrieve all active sessions for the current authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Sessions retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          sessions: [
            {
              token: 'abc123...',
              createdAt: '2025-10-23T10:00:00.000Z',
              expiresAt: '2025-10-30T10:00:00.000Z',
              ipAddress: '192.168.1.1',
              userAgent: 'Mozilla/5.0...',
              isActive: true,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getActiveSessions(@CurrentUser() user: User) {
    const sessions = await this.sessionService.getUserActiveSessions(user.id);

    return {
      success: true,
      data: {
        sessions: sessions.map((session) => ({
          token: session.token,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          isActive: session.isActive,
        })),
      },
    };
  }

  @Post('revoke-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke all sessions',
    description: 'Invalidate all active sessions for the current user (logout from all devices)',
  })
  @ApiResponse({
    status: 200,
    description: 'All sessions revoked successfully',
    schema: {
      example: {
        success: true,
        message: 'All sessions have been revoked. Please sign in again.',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async revokeAllSessions(@CurrentUser() user: User) {
    await this.sessionService.invalidateAllUserSessions(user.id);

    return {
      success: true,
      message: 'All sessions have been revoked. Please sign in again.',
    };
  }

  @Delete(':token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke specific session',
    description: 'Invalidate a specific session by token (logout from specific device)',
  })
  @ApiResponse({
    status: 200,
    description: 'Session revoked successfully',
    schema: {
      example: {
        success: true,
        message: 'Session revoked successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or session not found',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found or does not belong to you',
  })
  async revokeSession(
    @Param('token') token: string,
    @CurrentUser() user: User,
  ) {
    // Verify session belongs to user
    const sessions = await this.sessionService.getUserActiveSessions(user.id);
    const sessionExists = sessions.some((s) => s.token === token);

    if (!sessionExists) {
      throw new UnauthorizedException(
        'Session not found or does not belong to you',
      );
    }

    await this.sessionService.invalidateSession(token);

    return {
      success: true,
      message: 'Session revoked successfully',
    };
  }
}
