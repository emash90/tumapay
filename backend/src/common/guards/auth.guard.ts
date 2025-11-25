import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionService } from '../../modules/auth/session.service';
import { User } from '../../database/entities/user.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { JwtPayload } from '../../modules/auth/strategies/jwt.strategy';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => SessionService))
    private sessionService: SessionService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    // Strategy 1: Try to validate as JWT access token (fast, no DB lookup)
    const jwtValidated = await this.validateJwtToken(token, request);
    if (jwtValidated) {
      return true;
    }

    // Strategy 2: Fall back to session token validation (legacy support)
    const sessionValidated = await this.validateSessionToken(token, request);
    if (sessionValidated) {
      return true;
    }

    // Both strategies failed
    throw new UnauthorizedException('Invalid or expired authentication token');
  }

  /**
   * Validate JWT access token
   * Returns true if valid, false if invalid (to allow fallback)
   */
  private async validateJwtToken(token: string, request: any): Promise<boolean> {
    try {
      const secret = this.configService.get<string>('jwt.accessToken.secret') || 'default-secret';

      // Verify JWT signature and expiration
      const payload = this.jwtService.verify<JwtPayload>(token, { secret });

      if (!payload || !payload.sub) {
        return false;
      }

      // Load user from database
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['business'],
      });

      if (!user) {
        return false;
      }

      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Attach user to request (JWT tokens don't have session object)
      request.user = user;
      request.authType = 'jwt';

      return true;
    } catch (error) {
      // JWT validation failed, return false to try session token
      return false;
    }
  }

  /**
   * Validate session token (legacy support)
   * Returns true if valid, false if invalid
   */
  private async validateSessionToken(token: string, request: any): Promise<boolean> {
    try {
      // Use SessionService for session retrieval (Redis + DB)
      const session = await this.sessionService.getSession(token);

      if (!session) {
        return false;
      }

      // Check if user is active
      if (!session.user || !session.user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Attach user and session to request
      request.user = session.user;
      request.session = session;
      request.authType = 'session';

      return true;
    } catch (error) {
      // Session validation failed
      return false;
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization || request.headers.Authorization;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer') {
      return undefined;
    }

    return token;
  }
}
