import { User } from '../entities/user.entity';
import { Account } from '../entities/account.entity';
import * as crypto from 'crypto';
import { AppDataSource } from '../../config/data-source';

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

async function createSuperAdmin() {
  const dataSource = AppDataSource;

  try {
    await dataSource.initialize();
    console.log('📦 Database connected');

    const userRepository = dataSource.getRepository(User);
    const accountRepository = dataSource.getRepository(Account);

    // Check if super admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@tumapay.com' },
    });

    if (existingAdmin) {
      console.log('⚠️  Super admin already exists. Updating password...');

      // Update password
      const hashedPassword = await hashPassword('Admin123!');
      const account = await accountRepository.findOne({
        where: { userId: existingAdmin.id, providerId: 'email' },
      });

      if (account) {
        await accountRepository.update(account.id, { password: hashedPassword });
        console.log('✅ Super admin password updated');
      }
    } else {
      console.log('🌱 Creating new super admin user...');

      // Create super admin user
      const adminUser = userRepository.create({
        email: 'admin@tumapay.com',
        firstName: 'Super',
        lastName: 'Admin',
        emailVerified: true,
        isSuperAdmin: true,
      });
      await userRepository.save(adminUser);

      // Create account with hashed password
      const hashedPassword = await hashPassword('Admin123!');
      const adminAccount = accountRepository.create({
        userId: adminUser.id,
        providerId: 'email',
        providerAccountId: adminUser.email,
        password: hashedPassword,
      });
      await accountRepository.save(adminAccount);

      console.log('✅ Super admin created successfully');
    }

    console.log('\n📋 Super Admin Credentials:');
    console.log('   Email: admin@tumapay.com');
    console.log('   Password: Admin123!');
    console.log('\n🔐 Use these credentials to login and test Binance endpoints');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

createSuperAdmin()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
