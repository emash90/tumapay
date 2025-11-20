import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Cookie parser middleware (for httpOnly refresh tokens)
  app.use(cookieParser());

  // Global prefix for all routes
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      transform: true, // Automatically transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transformOptions: {
        enableImplicitConversion: true, // Automatically convert types
      },
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('TumaPay API')
    .setDescription('Cross-Border B2B Payment Remittance System - API Documentation')
    .setVersion('1.0')
    // Authentication & User Management
    .addTag('auth', 'Authentication endpoints')
    .addTag('sessions', 'Session management')
    .addTag('business', 'Business management')
    // Financial Operations
    .addTag('wallets', 'Wallet management')
    .addTag('transactions', 'Transaction management')
    .addTag('Transfers', 'Transfer operations')
    .addTag('Beneficiaries', 'Beneficiary management')
    // Currency & Exchange
    .addTag('Exchange Rates', 'Exchange rate information')
    .addTag('Conversion', 'Currency conversion')
    .addTag('Conversion Admin', 'Conversion administration')
    // Payment Integrations
    .addTag('payment-providers', 'Payment provider management')
    .addTag('mpesa-webhooks', 'M-Pesa webhook handlers')
    .addTag('Binance', 'Binance integration')
    .addTag('blockchain', 'Blockchain/TRON operations')
    // Bearer token authentication (JWT access token)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT access token (obtained from /auth/login)',
        in: 'header',
      },
      'bearer',
    )
    // Cookie authentication (for refresh token endpoints)
    .addCookieAuth('refreshToken', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refreshToken',
      description: 'HttpOnly refresh token cookie (set automatically on login)',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log('\n🚀 TumaPay API Server Started Successfully!');
  console.log(`📡 Server running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🔗 API Base URL: http://localhost:${port}/${apiPrefix}`);
  console.log(`🌍 Environment: ${configService.get('NODE_ENV')}`);
  console.log('\n');
}

bootstrap();
