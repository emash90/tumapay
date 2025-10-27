import { AppDataSource } from '../../config/data-source';
import { seedBusinessData } from './business.seed';

async function runSeeds() {
  try {
    console.log('🚀 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    console.log('\n📦 Running seed scripts...\n');

    // Run business seed data
    await seedBusinessData(AppDataSource);

    console.log('\n✨ All seeds completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running seeds:', error);
    process.exit(1);
  }
}

runSeeds();
