import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';

/**
 * JWT Payload structure
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Strategy for validating access tokens
 * Used by Passport to validate JWT tokens in Authorization header
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessToken.secret') || 'default-secret',
    });
  }

  /**
   * Validate JWT payload and return user object
   * This method is called automatically by Passport after JWT signature verification
   */
  async validate(payload: JwtPayload): Promise<User> {
    const { sub: userId } = payload;

    // Find user by ID
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['business'],
    });

    // Check if user exists and is active
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Return user object (will be attached to request.user)
    return user;
  }
}
