import { AppDataSource } from '../../config/data-source';
import { User } from '../entities/user.entity';
import { Account } from '../entities/account.entity';
import { Business } from '../entities/business.entity';
import { BusinessService } from '../../modules/business/business.service';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';

/**
 * Use same hashing logic as AuthService
 */
async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

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

    let adminUser = await userRepository.findOne({ where: { email: SUPER_ADMIN_EMAIL } });

    if (!adminUser) {
      console.log('🌱 Creating new super admin user...');

      adminUser = userRepository.create({
        email: SUPER_ADMIN_EMAIL,
        firstName: 'Super',
        lastName: 'Admin',
        emailVerified: true,
        isSuperAdmin: true,
      });
      await userRepository.save(adminUser);

      console.log('✅ Super admin user created');
    }

    const hashedPassword = await hashPassword(SUPER_ADMIN_PASSWORD);

    let account = await accountRepository.findOne({
      where: { userId: adminUser.id, providerId: 'email' },
    });

    if (account) {
      await accountRepository.update(account.id, { password: hashedPassword });
      console.log('🔑 Super admin password updated');
    } else {
      account = accountRepository.create({
        userId: adminUser.id,
        providerId: 'email',
        providerAccountId: adminUser.email,
        password: hashedPassword,
      });
      await accountRepository.save(account);
      console.log('🔑 Super admin account created');
    }

    let business = await businessService.getBusinessByUserId(adminUser.id);
    if (!business) {
      business = await businessService.createBusiness(BUSINESS_DATA as any);
      business.user = adminUser;
      await businessRepository.save(business);
      console.log(`🏢 Business created for super admin: ${business.businessName}`);
    } else {
      console.log(`ℹ️ Business already exists: ${business.businessName}`);
    }

    console.log('\n✅ Super Admin Ready!');
    console.log('📧 Email:', SUPER_ADMIN_EMAIL);
    console.log('🔐 Password:', SUPER_ADMIN_PASSWORD);
  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

createSuperAdmin();
