import { Module, forwardRef } from '@nestjs/common';
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
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Account, Session, Verification]),
    forwardRef(() => BusinessModule),
  ],
  controllers: [AuthController, SessionController],
  providers: [AuthService, SessionService, AuthGuard],
  exports: [
    AuthService,
    SessionService,
    AuthGuard,
    TypeOrmModule,
  ],
})
export class AuthModule {}
