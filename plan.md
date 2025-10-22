# TumaPay - Cross-Border B2B Payment Remittance System
## Development Plan & Architecture

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Complete Folder Structure](#complete-folder-structure)
4. [Development Phases](#development-phases)
5. [Detailed Implementation Steps](#detailed-implementation-steps)
6. [Better Auth Integration](#better-auth-integration)
7. [Docker Setup](#docker-setup)
8. [Database Schema Design](#database-schema-design)
9. [API Design](#api-design)
10. [Security Considerations](#security-considerations)
11. [Testing Strategy](#testing-strategy)

---

## Project Overview

**TumaPay** is a cross-border B2B payment remittance platform enabling businesses to send payments from Kenya to Turkey (Phase 1), with future expansion to China and other corridors.

### Core Features
- Multi-corridor payment processing (Kenya → Turkey, Kenya → China, etc.)
- Blockchain integration (TRON/USDT) for settlements
- Real-time forex rate management
- Compliance & KYC/KYB verification
- Multi-currency wallet management
- Transaction tracking & notifications
- Rate locking & hedging

---

## Technology Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL 15+
- **ORM**: TypeORM
- **Authentication**: Better Auth (with session + JWT support)
- **Message Queue**: RabbitMQ
- **Caching**: Redis
- **Blockchain**: TRON (TronWeb)
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer

### DevOps
- **Containerization**: Docker & Docker Compose
- **Version Control**: Git
- **Environment Management**: dotenv

### External Services
- **Forex Data**: Alpha Vantage / XE / Fixer.io
- **Payment Gateways**: M-Pesa (Kenya), Local Turkish banks
- **Compliance**: Chainalysis, ComplyAdvantage
- **Notifications**: SendGrid, Twilio, Firebase

---

## Complete Folder Structure

```
tumapay/
├── docker/
│   ├── postgres/
│   │   ├── Dockerfile
│   │   └── init.sql
│   ├── rabbitmq/
│   │   └── Dockerfile
│   └── redis/
│       └── Dockerfile
│
├── docker-compose.yml
├── Dockerfile
├── .dockerignore
│
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   │
│   ├── common/                   # Shared utilities
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── current-session.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── all-exceptions.filter.ts
│   │   ├── guards/
│   │   │   ├── better-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── api-key.guard.ts
│   │   ├── middleware/
│   │   │   ├── logger.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   ├── constants/
│   │   │   ├── app.constants.ts
│   │   │   ├── corridor.constants.ts
│   │   │   └── currency.constants.ts
│   │   └── utils/
│   │       ├── crypto.util.ts
│   │       ├── date.util.ts
│   │       └── formatter.util.ts
│   │
│   ├── config/                   # Configuration files
│   │   ├── app.config.ts
│   │   ├── better-auth.config.ts
│   │   ├── blockchain.config.ts
│   │   ├── database.config.ts
│   │   ├── forex.config.ts
│   │   ├── rabbitmq.config.ts
│   │   └── redis.config.ts
│   │
│   ├── database/
│   │   ├── entities/
│   │   │   ├── base.entity.ts
│   │   │   ├── user.entity.ts
│   │   │   ├── session.entity.ts
│   │   │   ├── account.entity.ts
│   │   │   ├── verification.entity.ts
│   │   │   ├── business.entity.ts
│   │   │   ├── wallet.entity.ts
│   │   │   ├── transaction.entity.ts
│   │   │   ├── corridor.entity.ts
│   │   │   ├── forex-rate.entity.ts
│   │   │   ├── compliance-check.entity.ts
│   │   │   ├── beneficiary.entity.ts
│   │   │   ├── settlement.entity.ts
│   │   │   └── audit-log.entity.ts
│   │   ├── migrations/
│   │   │   └── .gitkeep
│   │   ├── seeds/
│   │   │   ├── corridor.seed.ts
│   │   │   └── currency.seed.ts
│   │   └── subscribers/
│   │       └── transaction.subscriber.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── better-auth.ts           # Better Auth instance
│   │   │   ├── adapters/
│   │   │   │   └── typeorm.adapter.ts   # Custom TypeORM adapter
│   │   │   ├── plugins/
│   │   │   │   ├── business-context.plugin.ts
│   │   │   │   └── two-factor.plugin.ts
│   │   │   ├── dto/
│   │   │   │   ├── sign-up.dto.ts
│   │   │   │   ├── sign-in.dto.ts
│   │   │   │   ├── verify-email.dto.ts
│   │   │   │   ├── reset-password.dto.ts
│   │   │   │   └── two-factor.dto.ts
│   │   │   └── interfaces/
│   │   │       └── auth-session.interface.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   └── user-response.dto.ts
│   │   │   └── interfaces/
│   │   │       └── user.interface.ts
│   │   │
│   │   ├── business/
│   │   │   ├── business.module.ts
│   │   │   ├── business.service.ts
│   │   │   ├── business.controller.ts
│   │   │   └── dto/
│   │   │       ├── create-business.dto.ts
│   │   │       ├── update-business.dto.ts
│   │   │       └── business-verification.dto.ts
│   │   │
│   │   ├── wallets/
│   │   │   ├── wallets.module.ts
│   │   │   ├── wallets.service.ts
│   │   │   ├── wallets.controller.ts
│   │   │   ├── wallets.repository.ts
│   │   │   └── dto/
│   │   │       ├── create-wallet.dto.ts
│   │   │       ├── wallet-balance.dto.ts
│   │   │       └── wallet-transaction.dto.ts
│   │   │
│   │   ├── blockchain/          # Core blockchain logic
│   │   │   ├── blockchain.module.ts
│   │   │   ├── blockchain.service.ts
│   │   │   ├── tron.service.ts
│   │   │   ├── wallet-generator.service.ts
│   │   │   ├── interfaces/
│   │   │   │   ├── blockchain.interface.ts
│   │   │   │   └── transaction.interface.ts
│   │   │   └── dto/
│   │   │       ├── blockchain-transaction.dto.ts
│   │   │       ├── wallet-address.dto.ts
│   │   │       └── transfer.dto.ts
│   │   │
│   │   ├── forex/
│   │   │   ├── forex.module.ts
│   │   │   ├── forex.service.ts
│   │   │   ├── forex.controller.ts
│   │   │   ├── forex-provider.service.ts
│   │   │   ├── rate-cache.service.ts
│   │   │   └── dto/
│   │   │       ├── forex-rate.dto.ts
│   │   │       ├── rate-quote.dto.ts
│   │   │       └── rate-lock.dto.ts
│   │   │
│   │   ├── corridors/           # Each corridor = independent module
│   │   │   ├── base/
│   │   │   │   ├── corridor-base.service.ts
│   │   │   │   ├── corridor-base.controller.ts
│   │   │   │   └── interfaces/
│   │   │   │       └── corridor.interface.ts
│   │   │   │
│   │   │   ├── kenya-turkey/
│   │   │   │   ├── kenya-turkey.module.ts
│   │   │   │   ├── kenya-turkey.service.ts
│   │   │   │   ├── kenya-turkey.controller.ts
│   │   │   │   ├── providers/
│   │   │   │   │   ├── mpesa.service.ts
│   │   │   │   │   └── turkish-bank.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── kenya-turkey-payment.dto.ts
│   │   │   │       └── turkey-payout.dto.ts
│   │   │   │
│   │   │   ├── kenya-china/
│   │   │   │   ├── kenya-china.module.ts
│   │   │   │   ├── kenya-china.service.ts
│   │   │   │   ├── kenya-china.controller.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   └── kenya-nigeria/
│   │   │       ├── kenya-nigeria.module.ts
│   │   │       ├── kenya-nigeria.service.ts
│   │   │       ├── kenya-nigeria.controller.ts
│   │   │       └── dto/
│   │   │
│   │   ├── compliance/
│   │   │   ├── compliance.module.ts
│   │   │   ├── compliance.service.ts
│   │   │   ├── compliance.controller.ts
│   │   │   ├── kyc.service.ts
│   │   │   ├── kyb.service.ts
│   │   │   ├── aml.service.ts
│   │   │   └── dto/
│   │   │       ├── kyc-verification.dto.ts
│   │   │       ├── kyb-verification.dto.ts
│   │   │       └── aml-check.dto.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.gateway.ts
│   │   │   ├── email.service.ts
│   │   │   ├── sms.service.ts
│   │   │   └── dto/
│   │   │       ├── email-notification.dto.ts
│   │   │       └── sms-notification.dto.ts
│   │   │
│   │   ├── transactions/
│   │   │   ├── transactions.module.ts
│   │   │   ├── transactions.service.ts
│   │   │   ├── transactions.controller.ts
│   │   │   ├── transactions.repository.ts
│   │   │   ├── transaction-processor.service.ts
│   │   │   └── dto/
│   │   │       ├── create-transaction.dto.ts
│   │   │       ├── transaction-status.dto.ts
│   │   │       └── transaction-query.dto.ts
│   │   │
│   │   ├── beneficiaries/
│   │   │   ├── beneficiaries.module.ts
│   │   │   ├── beneficiaries.service.ts
│   │   │   ├── beneficiaries.controller.ts
│   │   │   └── dto/
│   │   │       ├── create-beneficiary.dto.ts
│   │   │       └── verify-beneficiary.dto.ts
│   │   │
│   │   ├── settlements/
│   │   │   ├── settlements.module.ts
│   │   │   ├── settlements.service.ts
│   │   │   ├── settlements.controller.ts
│   │   │   └── dto/
│   │   │       └── settlement.dto.ts
│   │   │
│   │   └── queue/
│   │       ├── queue.module.ts
│   │       ├── producers/
│   │       │   ├── transaction.producer.ts
│   │       │   ├── notification.producer.ts
│   │       │   └── compliance.producer.ts
│   │       └── consumers/
│   │           ├── transaction.consumer.ts
│   │           ├── notification.consumer.ts
│   │           └── compliance.consumer.ts
│   │
│   └── shared/
│       ├── interfaces/
│       │   ├── response.interface.ts
│       │   ├── pagination.interface.ts
│       │   └── queue-job.interface.ts
│       ├── constants/
│       │   ├── currencies.constant.ts
│       │   ├── countries.constant.ts
│       │   └── transaction-status.constant.ts
│       ├── helpers/
│       │   ├── response.helper.ts
│       │   ├── pagination.helper.ts
│       │   └── error.helper.ts
│       └── types/
│           ├── transaction.type.ts
│           └── user.type.ts
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/
│   ├── seed.ts
│   ├── migrate.ts
│   └── generate-keys.ts
│
├── .env.example
├── .env
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── README.md
```

---

## Development Phases

### Phase 1: Project Setup & Foundation (Week 1-2)
- Initialize NestJS project
- Setup Docker environment (PostgreSQL, RabbitMQ, Redis)
- Configure TypeORM and database connection
- **Setup Better Auth with TypeORM adapter**
- **Configure authentication tables (user, session, account, verification)**
- Setup project structure and common utilities
- Configure environment variables
- Setup linting and formatting

### Phase 2: Authentication & User Management (Week 3-4)
- **Auth Module**: Better Auth integration
  - Email/password authentication
  - Email verification
  - Password reset
  - Two-factor authentication (TOTP)
  - Session management
  - Organization/Business context
- **Users Module**: User profiles and management
- **Business Module**: Business entity management, KYB

### Phase 3: Core Modules Development (Week 5-6)
- **Wallets Module**: Multi-currency wallet creation and management
- **Beneficiaries Module**: Beneficiary management
- Role-based access control (RBAC)
- Business team member management

### Phase 4: Blockchain Integration (Week 7-8)
- **Blockchain Module**: TRON integration
- Wallet generation and management
- USDT transfer functionality
- Transaction monitoring and confirmations

### Phase 5: Forex & Corridor Setup (Week 9-10)
- **Forex Module**: Real-time rate fetching, rate locking
- **Kenya-Turkey Corridor**: Complete payment flow
  - M-Pesa integration (collection)
  - Turkish bank payout integration
  - Currency conversion logic

### Phase 6: Compliance & Security (Week 11-12)
- **Compliance Module**: KYC/KYB verification
- AML checks and transaction monitoring
- Document verification
- Risk scoring

### Phase 7: Transactions & Settlement (Week 13-14)
- **Transactions Module**: End-to-end transaction processing
- **Settlements Module**: Blockchain settlement tracking
- Transaction state management
- Reconciliation logic

### Phase 8: Notifications & Queue (Week 15-16)
- **Queue Module**: RabbitMQ integration
- **Notifications Module**: Email, SMS, push notifications
- WebSocket for real-time updates
- Event-driven architecture

### Phase 9: Testing & Documentation (Week 17-18)
- Unit tests for all services
- Integration tests
- E2E tests
- API documentation with Swagger
- Deployment preparation

---

## Detailed Implementation Steps

### Step 1: Initialize Project

```bash
# Install NestJS CLI
npm i -g @nestjs/cli

# Create project
nest new tumapay

# Install core dependencies
cd tumapay
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/config
npm install class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express

# Install Better Auth and dependencies
npm install better-auth
npm install @better-auth/typeorm-adapter
npm install nodemailer
npm install @node-rs/argon2  # For password hashing
npm install otplib qrcode    # For 2FA

# Install blockchain dependencies
npm install tronweb
npm install ethers

# Install message queue
npm install @nestjs/microservices amqplib amqp-connection-manager

# Install Redis
npm install @nestjs/cache-manager cache-manager
npm install cache-manager-redis-store redis

# Install utilities
npm install uuid
npm install moment
npm install libphonenumber-js

# Install dev dependencies
npm install -D @types/node
npm install -D @types/nodemailer
npm install -D @types/uuid
npm install -D @types/qrcode
```

### Step 2: Setup Docker Environment

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: tumapay_postgres
    restart: always
    environment:
      POSTGRES_DB: tumapay_db
      POSTGRES_USER: tumapay_user
      POSTGRES_PASSWORD: tumapay_pass_2024
      PGDATA: /var/lib/postgresql/data
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - tumapay_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tumapay_user -d tumapay_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    container_name: tumapay_rabbitmq
    restart: always
    environment:
      RABBITMQ_DEFAULT_USER: tumapay
      RABBITMQ_DEFAULT_PASS: tumapay_rabbit_2024
      RABBITMQ_DEFAULT_VHOST: /
    ports:
      - '5672:5672'   # AMQP port
      - '15672:15672' # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - tumapay_network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: tumapay_redis
    restart: always
    command: redis-server --requirepass tumapay_redis_2024
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    networks:
      - tumapay_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Optional: PgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: tumapay_pgadmin
    restart: always
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@tumapay.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - '5050:80'
    networks:
      - tumapay_network
    depends_on:
      - postgres

volumes:
  postgres_data:
    driver: local
  rabbitmq_data:
    driver: local
  redis_data:
    driver: local

networks:
  tumapay_network:
    driver: bridge
```

### Step 3: Create Docker PostgreSQL Init Script

Create `docker/postgres/init.sql`:

```sql
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS transactions;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS blockchain;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA public TO tumapay_user;
GRANT ALL PRIVILEGES ON SCHEMA transactions TO tumapay_user;
GRANT ALL PRIVILEGES ON SCHEMA compliance TO tumapay_user;
GRANT ALL PRIVILEGES ON SCHEMA blockchain TO tumapay_user;
```

### Step 4: Environment Configuration

Create `.env.example`:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
APP_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=tumapay_user
DB_PASSWORD=tumapay_pass_2024
DB_DATABASE=tumapay_db
DB_SYNCHRONIZE=false
DB_LOGGING=true

# Better Auth
BETTER_AUTH_SECRET=your-super-secret-better-auth-key-minimum-32-chars-long
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_TRUST_HOST=true

# Email Configuration (for Better Auth email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=TumaPay
SMTP_FROM_EMAIL=noreply@tumapay.com

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=tumapay
RABBITMQ_PASSWORD=tumapay_rabbit_2024
RABBITMQ_VHOST=/

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=tumapay_redis_2024
REDIS_TTL=3600

# Blockchain - TRON
TRON_NETWORK=mainnet
TRON_FULL_NODE=https://api.trongrid.io
TRON_SOLIDITY_NODE=https://api.trongrid.io
TRON_EVENT_SERVER=https://api.trongrid.io
TRON_PRIVATE_KEY=your-tron-private-key
TRON_API_KEY=your-trongrid-api-key
USDT_CONTRACT_ADDRESS=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t

# Forex API
FOREX_API_PROVIDER=alphavantage
FOREX_API_KEY=your-forex-api-key
FOREX_UPDATE_INTERVAL=300000

# M-Pesa (Kenya)
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_SHORTCODE=your-business-shortcode
MPESA_PASSKEY=your-lipa-na-mpesa-passkey
MPESA_ENVIRONMENT=sandbox

# Turkish Bank Integration
TURKISH_BANK_API_URL=https://api.turkishbank.com
TURKISH_BANK_API_KEY=your-bank-api-key
TURKISH_BANK_MERCHANT_ID=your-merchant-id

# Compliance
KYC_PROVIDER=onfido
KYC_API_KEY=your-kyc-api-key
AML_PROVIDER=chainalysis
AML_API_KEY=your-aml-api-key

# Notifications
SENDGRID_API_KEY=your-sendgrid-api-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=http://localhost:3001

# Logging
LOG_LEVEL=debug
```

---

## Better Auth Integration

### Why Better Auth?

Better Auth provides:
- **Type-safe**: Full TypeScript support with excellent type inference
- **Framework agnostic**: Works with any framework
- **Built-in features**: Email verification, password reset, 2FA, sessions
- **Flexible authentication**: Email/password, OAuth, magic links
- **Plugin system**: Extend functionality easily
- **Database adapters**: Built-in support for multiple databases
- **Session management**: Both cookie and bearer token support
- **Security**: Built-in CSRF protection, rate limiting

### Better Auth Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NestJS Application                       │
├─────────────────────────────────────────────────────────────┤
│  Auth Controller  →  Auth Service  →  Better Auth Instance  │
│       ↓                                         ↓            │
│  Better Auth Guard                      TypeORM Adapter      │
│       ↓                                         ↓            │
│  Protected Routes                         PostgreSQL        │
└─────────────────────────────────────────────────────────────┘
```

### Step 5: Create Better Auth Configuration

Create `src/config/better-auth.config.ts`:

```typescript
import { betterAuth } from 'better-auth';
import { typeORMAdapter } from '@better-auth/typeorm-adapter';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

export const createBetterAuthConfig = (
  configService: ConfigService,
  dataSource: DataSource,
) => {
  return betterAuth({
    // Database adapter
    database: typeORMAdapter(dataSource, {
      provider: 'postgres',
    }),

    // Email and password authentication
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },

    // Session configuration
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },

    // Account management
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['email'],
      },
    },

    // Advanced security options
    advanced: {
      cookiePrefix: 'tumapay',
      useSecureCookies: configService.get('NODE_ENV') === 'production',
      crossSubDomainCookies: {
        enabled: false,
      },
      generateId: () => {
        // Custom ID generation if needed
        return crypto.randomUUID();
      },
    },

    // Rate limiting
    rateLimit: {
      enabled: true,
      window: 60, // 1 minute
      max: 10, // 10 requests per window
    },

    // Email verification
    emailVerification: {
      sendOnSignUp: true,
      expiresIn: 60 * 60 * 24, // 24 hours
      sendVerificationEmail: async ({ user, url, token }) => {
        // Custom email sending logic
        // You'll implement this in the notifications module
        console.log(`Verification email for ${user.email}: ${url}`);
      },
    },

    // Password reset
    resetPassword: {
      enabled: true,
      expiresIn: 60 * 60, // 1 hour
      sendResetPasswordEmail: async ({ user, url, token }) => {
        // Custom email sending logic
        console.log(`Password reset for ${user.email}: ${url}`);
      },
    },

    // Two-factor authentication
    twoFactor: {
      enabled: true,
      issuer: 'TumaPay',
    },

    // Plugins
    plugins: [
      // Add custom plugins here
      // businessContextPlugin(),
      // auditLogPlugin(),
    ],

    // Trust proxy for production
    trustedOrigins: [configService.get('APP_URL')],
    baseURL: configService.get('BETTER_AUTH_URL'),
    secret: configService.get('BETTER_AUTH_SECRET'),
  });
};
```

### Step 6: Create Better Auth Database Entities

Better Auth requires specific database tables. Create entities:

**`src/database/entities/user.entity.ts`**:
```typescript
import { Entity, Column, OneToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Session } from './session.entity';
import { Account } from './account.entity';
import { Business } from './business.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  BUSINESS_OWNER = 'business_owner',
  BUSINESS_ADMIN = 'business_admin',
  BUSINESS_STAFF = 'business_staff',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  image: string;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phoneNumber: string;

  @Column({ type: 'boolean', default: false })
  phoneNumberVerified: boolean;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.BUSINESS_STAFF })
  role: UserRole;

  @Column({ type: 'boolean', default: false })
  twoFactorEnabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  twoFactorSecret: string;

  @Column({ type: 'varchar', nullable: true })
  twoFactorBackupCodes: string; // JSON string of backup codes

  @ManyToOne(() => Business, (business) => business.users, { nullable: true })
  business: Business;

  @Column({ type: 'uuid', nullable: true })
  businessId: string;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @OneToMany(() => Account, (account) => account.user)
  accounts: Account[];

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'varchar', nullable: true })
  lastLoginIp: string;
}
```

**`src/database/entities/session.entity.ts`**:
```typescript
import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('sessions')
@Index(['token'])
@Index(['userId'])
export class Session extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', nullable: true })
  userAgent: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;
}
```

**`src/database/entities/account.entity.ts`**:
```typescript
import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('accounts')
@Index(['providerId', 'providerAccountId'], { unique: true })
export class Account extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  providerId: string; // e.g., 'email', 'google', 'github'

  @Column({ type: 'varchar', length: 255 })
  providerAccountId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string; // Hashed password for email/password accounts

  @Column({ type: 'varchar', nullable: true })
  accessToken: string;

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string;

  @Column({ type: 'timestamp', nullable: true })
  accessTokenExpiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  refreshTokenExpiresAt: Date;

  @Column({ type: 'varchar', nullable: true })
  scope: string;

  @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;
}
```

**`src/database/entities/verification.entity.ts`**:
```typescript
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('verifications')
@Index(['identifier', 'token'], { unique: true })
export class Verification extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  identifier: string; // email or phone number

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'varchar', length: 50 })
  type: string; // 'email_verification', 'password_reset', 'phone_verification'
}
```

### Step 7: Create Better Auth Service

Create `src/modules/auth/auth.service.ts`:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BetterAuth } from 'better-auth';
import { createBetterAuthConfig } from '../../config/better-auth.config';

@Injectable()
export class AuthService implements OnModuleInit {
  private auth: BetterAuth;

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    this.auth = createBetterAuthConfig(
      this.configService,
      this.dataSource,
    ) as any;
  }

  getAuthInstance(): BetterAuth {
    return this.auth;
  }

  // Wrapper methods for common operations
  async signUp(data: { email: string; password: string; name: string }) {
    return this.auth.api.signUpEmail(data);
  }

  async signIn(data: { email: string; password: string }) {
    return this.auth.api.signInEmail(data);
  }

  async signOut(token: string) {
    return this.auth.api.signOut({ token });
  }

  async verifyEmail(token: string) {
    return this.auth.api.verifyEmail({ token });
  }

  async resetPassword(data: { token: string; password: string }) {
    return this.auth.api.resetPassword(data);
  }

  async getSession(token: string) {
    return this.auth.api.getSession({ token });
  }

  async enableTwoFactor(userId: string) {
    return this.auth.api.enableTwoFactor({ userId });
  }

  async verifyTwoFactor(data: { userId: string; code: string }) {
    return this.auth.api.verifyTwoFactor(data);
  }
}
```

### Step 8: Create Auth Controller

Create `src/modules/auth/auth.controller.ts`:

```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { BetterAuthGuard } from '../../common/guards/better-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  async signUp(@Body() signUpDto: SignUpDto, @Res() res: Response) {
    const result = await this.authService.signUp(signUpDto);
    return res.json(result);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  async signIn(@Body() signInDto: SignInDto, @Res() res: Response) {
    const result = await this.authService.signIn(signInDto);
    return res.json(result);
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.OK)
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign out current session' })
  async signOut(@Req() req: Request, @Res() res: Response) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const result = await this.authService.signOut(token);
    return res.json(result);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto, @Res() res: Response) {
    const result = await this.authService.verifyEmail(verifyEmailDto.token);
    return res.json(result);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Res() res: Response) {
    const result = await this.authService.resetPassword(resetPasswordDto);
    return res.json(result);
  }

  @Get('session')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current session' })
  async getSession(@Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.getSession(token);
  }

  @Post('2fa/enable')
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable two-factor authentication' })
  async enableTwoFactor(@Req() req: Request) {
    const userId = req['user'].id;
    return this.authService.enableTwoFactor(userId);
  }
}
```

### Step 9: Create DTOs

Create authentication DTOs in `src/modules/auth/dto/`:

**`sign-up.dto.ts`**:
```typescript
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;
}
```

**`sign-in.dto.ts`**:
```typescript
import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password: string;
}
```

### Step 10: Create Better Auth Guard

Create `src/common/guards/better-auth.guard.ts`:

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class BetterAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const session = await this.authService.getSession(token);

      if (!session || !session.user) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      // Attach user to request
      request['user'] = session.user;
      request['session'] = session;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### Step 11: Create Current User Decorator

Create `src/common/decorators/current-user.decorator.ts`:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
```

### Step 12: Update Auth Module

Create `src/modules/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../../database/entities/user.entity';
import { Session } from '../../database/entities/session.entity';
import { Account } from '../../database/entities/account.entity';
import { Verification } from '../../database/entities/verification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session, Account, Verification]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## Database Schema Design

### Core Tables (with Better Auth integration)

#### 1. Users Table (Better Auth compatible)
```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- name (VARCHAR)
- image (VARCHAR, nullable)
- email_verified (BOOLEAN)
- phone_number (VARCHAR, nullable)
- phone_number_verified (BOOLEAN)
- role (ENUM: super_admin, business_owner, business_admin, business_staff)
- two_factor_enabled (BOOLEAN)
- two_factor_secret (VARCHAR, nullable)
- two_factor_backup_codes (VARCHAR, nullable)
- business_id (UUID, FK, nullable)
- last_login_at (TIMESTAMP, nullable)
- last_login_ip (VARCHAR, nullable)
- created_at, updated_at, deleted_at
- is_active (BOOLEAN)
```

#### 2. Sessions Table (Better Auth)
```sql
- id (UUID, PK)
- token (VARCHAR, UNIQUE)
- expires_at (TIMESTAMP)
- ip_address (VARCHAR, nullable)
- user_agent (VARCHAR, nullable)
- user_id (UUID, FK)
- created_at, updated_at
```

#### 3. Accounts Table (Better Auth)
```sql
- id (UUID, PK)
- provider_id (VARCHAR) - 'email', 'google', etc.
- provider_account_id (VARCHAR)
- password (VARCHAR, nullable) - hashed
- access_token (VARCHAR, nullable)
- refresh_token (VARCHAR, nullable)
- access_token_expires_at (TIMESTAMP, nullable)
- refresh_token_expires_at (TIMESTAMP, nullable)
- scope (VARCHAR, nullable)
- user_id (UUID, FK)
- created_at, updated_at
```

#### 4. Verifications Table (Better Auth)
```sql
- id (UUID, PK)
- identifier (VARCHAR) - email or phone
- token (VARCHAR)
- expires_at (TIMESTAMP)
- type (VARCHAR) - 'email_verification', 'password_reset', etc.
- created_at, updated_at
```

#### 5. Businesses Table
```sql
- id (UUID, PK)
- business_name (VARCHAR)
- registration_number (VARCHAR)
- tax_id (VARCHAR)
- country (VARCHAR)
- kyb_status (ENUM: pending, verified, rejected)
- kyb_provider_id (VARCHAR)
- tier (ENUM: basic, premium, enterprise)
- created_at, updated_at
```

#### 6. Wallets Table
```sql
- id (UUID, PK)
- business_id (UUID, FK)
- currency (VARCHAR) - KES, TRY, USDT, CNY
- balance (DECIMAL)
- available_balance (DECIMAL)
- blockchain_address (VARCHAR) - for USDT
- wallet_type (ENUM: fiat, crypto)
- created_at, updated_at
```

#### 7. Transactions Table
```sql
- id (UUID, PK)
- business_id (UUID, FK)
- corridor_id (UUID, FK)
- from_wallet_id (UUID, FK)
- to_wallet_id (UUID, FK)
- beneficiary_id (UUID, FK)
- source_amount (DECIMAL)
- source_currency (VARCHAR)
- destination_amount (DECIMAL)
- destination_currency (VARCHAR)
- exchange_rate (DECIMAL)
- fee_amount (DECIMAL)
- status (ENUM: pending, processing, completed, failed, refunded)
- blockchain_tx_hash (VARCHAR)
- purpose (VARCHAR)
- reference_number (VARCHAR, UNIQUE)
- created_at, updated_at
```

---

## API Design

### Authentication Endpoints (Better Auth)
```
POST   /api/v1/auth/sign-up            - Register new user
POST   /api/v1/auth/sign-in            - Sign in with email/password
POST   /api/v1/auth/sign-out           - Sign out
GET    /api/v1/auth/session            - Get current session
POST   /api/v1/auth/verify-email       - Verify email
POST   /api/v1/auth/forgot-password    - Request password reset
POST   /api/v1/auth/reset-password     - Reset password
POST   /api/v1/auth/2fa/enable         - Enable 2FA
POST   /api/v1/auth/2fa/verify         - Verify 2FA code
POST   /api/v1/auth/2fa/disable        - Disable 2FA
```

### User & Business Management
```
GET    /api/v1/users/me                - Get current user profile
PATCH  /api/v1/users/me                - Update profile
POST   /api/v1/users/change-password   - Change password

POST   /api/v1/business/create         - Create business profile
GET    /api/v1/business/me             - Get business details
PATCH  /api/v1/business/me             - Update business
POST   /api/v1/business/verify         - Submit KYB verification
GET    /api/v1/business/team           - List team members
POST   /api/v1/business/team/invite    - Invite team member
```

### Kenya-Turkey Corridor Endpoints
```
GET    /api/v1/corridors/kenya-turkey/quote        - Get payment quote
POST   /api/v1/corridors/kenya-turkey/initiate     - Initiate payment
GET    /api/v1/corridors/kenya-turkey/status/:id   - Check status
POST   /api/v1/corridors/kenya-turkey/confirm      - Confirm payment
```

### Wallet Endpoints
```
GET    /api/v1/wallets                - Get all wallets
GET    /api/v1/wallets/:id            - Get wallet details
GET    /api/v1/wallets/:id/balance    - Get balance
GET    /api/v1/wallets/:id/transactions - Get transactions
POST   /api/v1/wallets/create         - Create new wallet
```

### Transaction Endpoints
```
GET    /api/v1/transactions           - List transactions
GET    /api/v1/transactions/:id       - Get transaction details
POST   /api/v1/transactions           - Create transaction
GET    /api/v1/transactions/:id/track - Track transaction
```

---

## Security Considerations

1. **Authentication & Authorization (Better Auth)**
   - Session-based authentication with secure cookies
   - Bearer token support for API access
   - Email verification required
   - Two-factor authentication (TOTP)
   - Password reset with expiring tokens
   - Role-based access control (RBAC)

2. **Data Encryption**
   - Passwords hashed with Argon2
   - Encrypt sensitive data at rest
   - Use HTTPS/TLS for all communications
   - Encrypt private keys and API credentials

3. **Rate Limiting**
   - Built-in Better Auth rate limiting
   - Additional rate limiting per IP/user
   - Protect against brute force attacks

4. **Session Security**
   - Secure session tokens
   - Session expiration and rotation
   - IP address and user agent tracking
   - Automatic session cleanup

5. **Compliance**
   - KYC/KYB verification for all businesses
   - AML screening for transactions
   - Transaction monitoring and reporting
   - Maintain audit logs

---

## Testing Strategy

### Unit Tests
```bash
npm run test
```
- Test AuthService methods
- Test session management
- Test user creation and verification
- Mock Better Auth dependencies

### Integration Tests
```bash
npm run test:e2e
```
- Test complete authentication flows
- Test session persistence
- Test email verification
- Test 2FA flow

### E2E Tests
```bash
npm run test:e2e
```
- Test complete user journey from signup to transaction
- Test authentication flows
- Test error scenarios

---

## Development Workflow

### Start Development

```bash
# 1. Start Docker services
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Run migrations
npm run typeorm migration:run

# 4. Start development server
npm run start:dev
```

### Create Database Migrations

```bash
# Generate migration
npm run typeorm migration:generate -- -n CreateAuthTables

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

---

## Next Steps

### Immediate Actions (Week 1)
1. **Setup Project**
   - [ ] Initialize NestJS project
   - [ ] Install all dependencies (including Better Auth)
   - [ ] Setup Docker environment
   - [ ] Configure environment variables

2. **Database Setup**
   - [ ] Create base entity
   - [ ] Create Better Auth entities (User, Session, Account, Verification)
   - [ ] Create initial migration
   - [ ] Run migrations

3. **Better Auth Integration**
   - [ ] Configure Better Auth instance
   - [ ] Create Auth service
   - [ ] Create Auth controller
   - [ ] Create DTOs
   - [ ] Create guards and decorators
   - [ ] Test authentication flow

### Week 2: Complete Auth Module
   - [ ] Add email verification flow
   - [ ] Add password reset flow
   - [ ] Add 2FA (TOTP) support
   - [ ] Create role-based guards
   - [ ] Add session management
   - [ ] Write tests for auth module

### Week 3-4: User & Business Management
   - [ ] Create Business entity and module
   - [ ] Business registration flow
   - [ ] Team member invitation
   - [ ] Role management
   - [ ] KYB verification integration

---

## Useful Commands

```bash
# Docker
docker-compose up -d              # Start services
docker-compose down               # Stop services
docker-compose logs -f postgres   # View PostgreSQL logs

# Development
npm run start:dev                 # Start development server
npm run build                     # Build for production
npm run start:prod                # Start production server

# Database
npm run typeorm migration:run     # Run migrations
npm run typeorm migration:revert  # Revert migration

# Testing
npm run test                      # Run unit tests
npm run test:e2e                  # Run E2E tests
npm run test:cov                  # Coverage report
```

---

## Resources

- **Better Auth**: https://www.better-auth.com/docs
- **NestJS**: https://docs.nestjs.com
- **TypeORM**: https://typeorm.io
- **TRON**: https://developers.tron.network
- **RabbitMQ**: https://www.rabbitmq.com/documentation.html

---

**Last Updated**: 2025-10-21
**Version**: 1.0.0
