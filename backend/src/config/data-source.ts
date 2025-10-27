import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from root .env file
config({ path: join(__dirname, '../../../.env') });

// For migrations run from host machine, we always use localhost:5433
// The DB_HOST=postgres is only for Docker containers
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: process.env.DB_USERNAME || 'tumapay_user',
  password: process.env.DB_PASSWORD || 'tumapay_pass_2024',
  database: process.env.DB_DATABASE || 'tumapay_db',
  entities: [join(__dirname, '../database/entities/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
});
