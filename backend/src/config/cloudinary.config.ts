import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export const getCloudinaryConfig = (configService: ConfigService) => ({
  cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
  api_key: configService.get<string>('CLOUDINARY_API_KEY'),
  api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
  secure: true,
});

export const CLOUDINARY_PROVIDER = 'CLOUDINARY';

export const CloudinaryProvider = {
  provide: CLOUDINARY_PROVIDER,
  useFactory: (configService: ConfigService) => {
    const config = getCloudinaryConfig(configService);
    cloudinary.config(config);
    return cloudinary;
  },
  inject: [ConfigService],
};
