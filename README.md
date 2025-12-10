# TumaPay

A modern cross-border payment platform that enables seamless international money transfers using blockchain technology. TumaPay allows users to load their wallets through various payment methods and transfer funds across borders via the TRON blockchain network, with beneficiaries receiving payments directly to their bank accounts in local currency.

## What TumaPay Does

TumaPay is a cross-border payment solution that:

- **Cross-Border Transfers**: Send money internationally using USDT on the TRON blockchain for fast, low-cost transactions
- **Multiple Deposit Methods**: Load your TumaPay wallet via M-Pesa (with more payment methods coming soon)
- **Local Currency Payouts**: Beneficiaries receive funds directly to their bank accounts in their local currency
- **Turkish Corridor**: Initially focused on the Turkey payment corridor, with plans to expand to additional corridors
- **Multi-Wallet Management**: Supports multiple wallet types including M-Pesa, USDT, and virtual wallets with real-time balance tracking
- **Secure Transactions**: Provides robust authentication, session management, and transaction verification
- **Real-Time Exchange Rates**: Fetches live cryptocurrency prices and currency exchange rates for accurate conversions
- **Transaction History**: Comprehensive tracking of deposits, withdrawals, and cross-border transfers with detailed analytics
- **Business Account Support**: Enables businesses to manage international payments and track transactions

## How It Works

1. **Load Wallet**: Users deposit funds into their TumaPay wallet using M-Pesa or other supported payment methods
2. **Convert to USDT**: Funds are converted to USDT (stablecoin) on the TRON blockchain
3. **Transfer Cross-Border**: Send USDT to recipients in other countries instantly and securely via TRON network
4. **Cash Out**: Recipients receive funds directly to their bank accounts in their local currency

## Technology Stack

### Backend
- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis for session management and rate limiting
- **Authentication**: JWT + Better Auth with CSRF protection
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest for unit and E2E tests

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for analytics visualization
- **Routing**: React Router v7

### Integrations
- **M-Pesa Daraja API**: For mobile money deposits (additional payment methods coming soon)
- **TRON Network**: USDT TRC20 token transfers for cross-border payments
- **Binance API**: Cryptocurrency market data
- **CurrencyAPI**: Real-time exchange rates

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx for production deployment
- **Database Admin**: PgAdmin for database management

## Quick Start

Get TumaPay running in Docker in under 5 minutes!

### Prerequisites

- Docker Desktop installed
- Git installed

### 1. Clone and Setup

```bash
# Navigate to the project
cd tumapay

# Copy environment file
cp backend/.env.example .env
```

### 2. Update Environment Variables

Edit `.env` file and ensure these settings:

```env
# Application
PORT=4000
NODE_ENV=production

# Database (Docker)
DB_HOST=postgres
DB_PORT=5432

# Redis (Docker)
REDIS_HOST=redis
REDIS_PORT=6379

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Start All Services

```bash
# Build and start everything
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api/v1
- **API Docs**: http://localhost:4000/api/docs
- **Database Admin**: http://localhost:5050

That's it! The application is now running.

## Development Mode

For development with hot-reload and automatic code reloading:

```bash
# Start in development mode
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Or in background
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Now you can edit code and see changes instantly:
- **Client**: Edit files in `./client/src`
- **Backend**: Edit files in `./backend/src`

## Common Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart a service
docker-compose restart backend
docker-compose restart client

# Rebuild a service
docker-compose up -d --build backend

# Execute commands in containers
docker-compose exec backend npm run migration:run
docker-compose exec backend npm run seed:run
```

## Default Credentials

### Test User
- Email: `john.doe@example.com`
- Password: `Password123!`

### PgAdmin
- Email: `admin@tumapay.com`
- Password: `admin123`

## Project Structure

```
tumapay/
├── backend/              # NestJS backend application
│   ├── src/
│   │   ├── modules/      # Feature modules (auth, wallets, transactions, etc.)
│   │   ├── config/       # Configuration files
│   │   ├── database/     # Database migrations and seeds
│   │   ├── common/       # Shared utilities and decorators
│   │   └── shared/       # Shared services
│   └── test/             # E2E tests
├── client/               # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── api/          # API client functions
│   │   ├── store/        # Zustand state management
│   │   └── lib/          # Utility functions
├── docker/               # Docker configuration files
├── docs/                 # Additional documentation
├── docker-compose.yml    # Production Docker setup
└── docker-compose.dev.yml # Development Docker setup
```

## Key Features

### Wallet Management
- Create and manage multiple wallet types (M-Pesa, USDT, Virtual)
- Real-time balance updates
- Transaction history with filtering and search
- Automated balance reconciliation

### Transaction Processing
- **Deposits**: Load TumaPay wallet via M-Pesa (with more payment methods coming soon)
- **Cross-Border Transfers**: Send money internationally via USDT on TRON blockchain
- **Withdrawals**: Beneficiaries receive funds directly to their bank accounts in local currency
- **Conversions**: Exchange between different currencies and cryptocurrencies

### Payment Corridors
- **Turkey Corridor**: Initial focus on Turkish market with bank account payouts in Turkish Lira
- **Expansion Plans**: Additional corridors to be added progressively

### Security Features
- JWT-based authentication with refresh tokens
- CSRF protection on all state-changing operations
- Session management with Redis
- Rate limiting and request throttling
- Input validation and sanitization
- Secure password hashing

### Real-Time Data
- Live cryptocurrency prices via Binance API
- Current exchange rates from CurrencyAPI
- Transaction status updates
- Wallet balance synchronization

## API Documentation

Once the application is running, access the interactive API documentation:

**Swagger UI**: http://localhost:4000/api/docs

The documentation includes:
- All available endpoints
- Request/response schemas
- Authentication requirements
- Try-it-out functionality

## Environment Configuration

Key environment variables to configure:

```env
# M-Pesa Configuration (current deposit method)
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379

# TRON Configuration (for cross-border transfers)
TRON_NETWORK=nile
TRON_API_URL=https://nile.trongrid.io
TRON_PRIVATE_KEY=your_private_key
TRON_WALLET_ADDRESS=your_wallet_address

# Binance API (for market data)
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_api_secret
BINANCE_TESTNET=true

# Currency API (for exchange rates)
CURRENCY_API_KEY=your_currency_api_key
```

For a complete list of environment variables, see `backend/.env.example`.