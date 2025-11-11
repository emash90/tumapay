import { AppDataSource } from '../../config/data-source';
import { User } from '../entities/user.entity';
import { Account } from '../entities/account.entity';
import { Business } from '../entities/business.entity';
import { BusinessService } from '../../modules/business/business.service';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';

/**
 * Hash password with PBKDF2 + random salt
 */
async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Super admin credentials & business details
 */
const SUPER_ADMIN_EMAIL = 'admin@tumapay.com';
const SUPER_ADMIN_PASSWORD = 'Admin123!';
const BUSINESS_DATA = {
  businessName: 'Tumapay Ltd',
  registrationNumber: 'PVT-000001',
  kraPin: 'A000000000X',
  country: 'KE',
  industry: 'Finance',
  businessEmail: 'info@tumapay.com',
  businessPhone: '+254700000000',
  address: '123 Admin Street',
  city: 'Nairobi',
  state: 'Nairobi County',
  postalCode: '00100',
  taxId: 'TAX-000001',
  description: 'Tumapay Super Admin Business',
  website: 'https://www.tumapay.com',
};

async function createSuperAdmin() {
  const dataSource = AppDataSource;

  try {
    await dataSource.initialize();
    console.log('📦 Database connected');

    const userRepository: Repository<User> = dataSource.getRepository(User);
    const accountRepository: Repository<Account> = dataSource.getRepository(Account);
    const businessRepository: Repository<Business> = dataSource.getRepository(Business);

    const businessService = new BusinessService(businessRepository);

    // Check if super admin already exists
    let adminUser = await userRepository.findOne({ where: { email: SUPER_ADMIN_EMAIL } });

    if (adminUser) {
      console.log('⚠️  Super admin already exists. Updating password...');
      const hashedPassword = await hashPassword(SUPER_ADMIN_PASSWORD);

      const account = await accountRepository.findOne({
        where: { userId: adminUser.id, providerId: 'email' },
      });

      if (account) {
        await accountRepository.update(account.id, { password: hashedPassword });
        console.log('✅ Super admin password updated');
      }
    } else {
      console.log('🌱 Creating new super admin user...');

      // Create user
      adminUser = userRepository.create({
        email: SUPER_ADMIN_EMAIL,
        firstName: 'Super',
        lastName: 'Admin',
        emailVerified: true,
        isSuperAdmin: true,
      });
      await userRepository.save(adminUser);

      // Create account with password
      const hashedPassword = await hashPassword(SUPER_ADMIN_PASSWORD);
      const adminAccount = accountRepository.create({
        userId: adminUser.id,
        providerId: 'email',
        providerAccountId: adminUser.email,
        password: hashedPassword,
      });
      await accountRepository.save(adminAccount);

      console.log('✅ Super admin created successfully');
    }

    // Attach business to super admin
    let business: Business | null = await businessService.getBusinessByUserId(adminUser.id);

    if (business) {
      console.log(`ℹ️  Business already exists for super admin: ${business.businessName}`);
    } else {
      // Create business (without userId in DTO)
      business = await businessService.createBusiness(BUSINESS_DATA as any); // Type cast to avoid DTO error
      // Attach user manually
      business.user = adminUser;
      await businessRepository.save(business);
      console.log(`🌱 Business created for super admin: ${business.businessName} (${business.id})`);
    }

    console.log('\n📋 Super Admin Credentials:');
    console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);
    console.log('\n🔐 Use these credentials to login and test endpoints');

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
