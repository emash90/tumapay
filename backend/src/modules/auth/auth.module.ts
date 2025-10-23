import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { SessionController } from './session.controller';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { User } from '../../database/entities/user.entity';
import { Account } from '../../database/entities/account.entity';
import { Session } from '../../database/entities/session.entity';
import { Verification } from '../../database/entities/verification.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Account, Session, Verification]),
  ],
  controllers: [AuthController, SessionController],
  providers: [AuthService, SessionService, AuthGuard, RolesGuard],
  exports: [
    AuthService,
    SessionService,
    AuthGuard,
    RolesGuard,
    TypeOrmModule,
  ],
})
export class AuthModule {}
