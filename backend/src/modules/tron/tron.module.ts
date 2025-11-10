import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TronService } from './tron.service';
import tronConfig from '../../config/tron.config';

@Module({
  imports: [ConfigModule.forFeature(tronConfig)],
  providers: [TronService],
  exports: [TronService],
})
export class TronModule {}
