import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { SessionController } from './session.controller';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../../database/entities/user.entity';
import { Account } from '../../database/entities/account.entity';
import { Session } from '../../database/entities/session.entity';
import { Verification } from '../../database/entities/verification.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { BusinessModule } from '../business/business.module';
import { EmailModule } from '../email/email.module';
import jwtConfig from '../../config/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Account, Session, Verification]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        return {
          secret: configService.get<string>('jwt.accessToken.secret') || 'default-secret',
          signOptions: {
            expiresIn: '30m',
          },
        };
      },
    }),
    ConfigModule.forFeature(jwtConfig),
    EmailModule,
    forwardRef(() => BusinessModule),
  ],
  controllers: [AuthController, SessionController],
  providers: [AuthService, SessionService, JwtStrategy, AuthGuard],
  exports: [
    AuthService,
    SessionService,
    AuthGuard,
    JwtModule,
    TypeOrmModule,
  ],
})
export class AuthModule {}
