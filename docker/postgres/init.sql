-- TumaPay Database Initialization Script
-- This script runs automatically when the PostgreSQL container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas for organizing tables
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS transactions;
CREATE SCHEMA IF NOT EXISTS compliance;

-- Grant permissions to tumapay_user
GRANT ALL PRIVILEGES ON SCHEMA public TO tumapay_user;
GRANT ALL PRIVILEGES ON SCHEMA transactions TO tumapay_user;
GRANT ALL PRIVILEGES ON SCHEMA compliance TO tumapay_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tumapay_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA transactions GRANT ALL ON TABLES TO tumapay_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA compliance GRANT ALL ON TABLES TO tumapay_user;

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'TumaPay database initialized successfully';
END $$;
