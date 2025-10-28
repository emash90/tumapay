import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { Business } from '../../database/entities/business.entity';
import { BusinessVerifiedGuard } from './guards/business-verified.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business]),
    forwardRef(() => AuthModule),
  ],
  controllers: [BusinessController],
  providers: [BusinessService, BusinessVerifiedGuard],
  exports: [BusinessService, BusinessVerifiedGuard],
})
export class BusinessModule {}
