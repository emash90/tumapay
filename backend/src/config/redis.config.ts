import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';

export const getRedisConfig = async (configService: ConfigService) => {
  return {
    store: await redisStore({
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
      password: configService.get('REDIS_PASSWORD'),
      ttl: configService.get('REDIS_TTL', 604800), // 7 days in seconds
      keyPrefix: 'tumapay:',
      // Connection options
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      // Reconnect on error
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    }),
  };
};
