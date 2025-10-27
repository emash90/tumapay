import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Business, BusinessKYBStatus, BusinessTier } from '../entities/business.entity';
import { Account } from '../entities/account.entity';
import { hash } from 'crypto';

/**
 * Seed data for Business Module Phase 1 testing
 * Creates test users with associated businesses
 */
export async function seedBusinessData(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const businessRepository = dataSource.getRepository(Business);
  const accountRepository = dataSource.getRepository(Account);

  console.log('🌱 Seeding business data...');

  // 1. Create Super Admin User (no business)
  const superAdminUser = userRepository.create({
    email: 'admin@tumapay.com',
    firstName: 'Super',
    lastName: 'Admin',
    emailVerified: true,
    isSuperAdmin: true,
  });
  await userRepository.save(superAdminUser);

  // Create account for super admin
  const superAdminAccount = accountRepository.create({
    userId: superAdminUser.id,
    providerId: 'email',
    providerAccountId: superAdminUser.email,
    // In production, use proper hashing (e.g., argon2)
    password: 'hashed_password_admin123', // This is a placeholder
  });
  await accountRepository.save(superAdminAccount);

  console.log('✅ Created super admin user');

  // 2. Create Regular User with Verified Business (Kenya)
  const business1 = businessRepository.create({
    businessName: 'Acme Corporation Ltd',
    registrationNumber: 'PVT-123456789',
    kraPin: 'A123456789X',
    country: 'KE',
    industry: 'Technology',
    businessEmail: 'info@acmecorp.com',
    businessPhone: '+254712345678',
    address: '123 Business Street',
    city: 'Nairobi',
    state: 'Nairobi County',
    postalCode: '00100',
    kybStatus: BusinessKYBStatus.VERIFIED,
    tier: BusinessTier.PREMIUM,
    dailyLimit: 50000,
    monthlyLimit: 200000,
    kybVerifiedAt: new Date(),
  });
  await businessRepository.save(business1);

  const user1 = userRepository.create({
    email: 'john.doe@acmecorp.com',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+254712345678',
    emailVerified: true,
    businessId: business1.id,
    isSuperAdmin: false,
  });
  await userRepository.save(user1);

  const account1 = accountRepository.create({
    userId: user1.id,
    providerId: 'email',
    providerAccountId: user1.email,
    password: 'hashed_password_john123',
  });
  await accountRepository.save(account1);

  console.log('✅ Created verified business user (Kenya)');

  // 3. Create User with Pending Business (Kenya)
  const business2 = businessRepository.create({
    businessName: 'TechStart Solutions',
    registrationNumber: 'PVT-987654321',
    kraPin: 'P987654321K',
    country: 'KE',
    industry: 'Software Development',
    businessEmail: 'contact@techstart.co.ke',
    businessPhone: '+254722334455',
    address: '456 Innovation Hub',
    city: 'Nairobi',
    state: 'Nairobi County',
    postalCode: '00200',
    kybStatus: BusinessKYBStatus.PENDING,
    tier: BusinessTier.BASIC,
    dailyLimit: 10000,
    monthlyLimit: 50000,
  });
  await businessRepository.save(business2);

  const user2 = userRepository.create({
    email: 'jane.smith@techstart.co.ke',
    firstName: 'Jane',
    lastName: 'Smith',
    phoneNumber: '+254722334455',
    emailVerified: true,
    businessId: business2.id,
    isSuperAdmin: false,
  });
  await userRepository.save(user2);

  const account2 = accountRepository.create({
    userId: user2.id,
    providerId: 'email',
    providerAccountId: user2.email,
    password: 'hashed_password_jane123',
  });
  await accountRepository.save(account2);

  console.log('✅ Created pending business user (Kenya)');

  // 4. Create User with In-Review Business (Kenya)
  const business3 = businessRepository.create({
    businessName: 'Global Trade Partners Ltd',
    registrationNumber: 'PVT-555666777',
    kraPin: 'A555666777T',
    country: 'KE',
    industry: 'Import/Export',
    businessEmail: 'admin@globaltrade.co.ke',
    businessPhone: '+254733445566',
    address: '789 Export Processing Zone',
    city: 'Mombasa',
    state: 'Mombasa County',
    postalCode: '80100',
    kybStatus: BusinessKYBStatus.IN_REVIEW,
    tier: BusinessTier.BASIC,
    dailyLimit: 10000,
    monthlyLimit: 50000,
  });
  await businessRepository.save(business3);

  const user3 = userRepository.create({
    email: 'peter.kimani@globaltrade.co.ke',
    firstName: 'Peter',
    lastName: 'Kimani',
    phoneNumber: '+254733445566',
    emailVerified: true,
    businessId: business3.id,
    isSuperAdmin: false,
  });
  await userRepository.save(user3);

  const account3 = accountRepository.create({
    userId: user3.id,
    providerId: 'email',
    providerAccountId: user3.email,
    password: 'hashed_password_peter123',
  });
  await accountRepository.save(account3);

  console.log('✅ Created in-review business user (Kenya)');

  // 5. Create User with Rejected Business (Kenya)
  const business4 = businessRepository.create({
    businessName: 'QuickCash Services',
    registrationNumber: 'PVT-111222333',
    kraPin: 'P111222333Q',
    country: 'KE',
    industry: 'Financial Services',
    businessEmail: 'info@quickcash.co.ke',
    businessPhone: '+254744556677',
    address: '321 Finance Street',
    city: 'Nairobi',
    state: 'Nairobi County',
    postalCode: '00300',
    kybStatus: BusinessKYBStatus.REJECTED,
    kybRejectionReason: 'Incomplete documentation - missing tax compliance certificate',
    tier: BusinessTier.BASIC,
    dailyLimit: 10000,
    monthlyLimit: 50000,
  });
  await businessRepository.save(business4);

  const user4 = userRepository.create({
    email: 'mary.wanjiru@quickcash.co.ke',
    firstName: 'Mary',
    lastName: 'Wanjiru',
    phoneNumber: '+254744556677',
    emailVerified: true,
    businessId: business4.id,
    isSuperAdmin: false,
  });
  await userRepository.save(user4);

  const account4 = accountRepository.create({
    userId: user4.id,
    providerId: 'email',
    providerAccountId: user4.email,
    password: 'hashed_password_mary123',
  });
  await accountRepository.save(account4);

  console.log('✅ Created rejected business user (Kenya)');

  // 6. Create Enterprise Tier Business (Kenya)
  const business5 = businessRepository.create({
    businessName: 'Enterprise Logistics Ltd',
    registrationNumber: 'PVT-999888777',
    kraPin: 'A999888777E',
    country: 'KE',
    industry: 'Logistics & Transportation',
    businessEmail: 'corporate@enterprise-logistics.co.ke',
    businessPhone: '+254755667788',
    address: '100 Enterprise Way',
    city: 'Nairobi',
    state: 'Nairobi County',
    postalCode: '00400',
    kybStatus: BusinessKYBStatus.VERIFIED,
    tier: BusinessTier.ENTERPRISE,
    dailyLimit: 500000,
    monthlyLimit: 5000000,
    kybVerifiedAt: new Date(),
    description: 'Leading logistics provider in East Africa',
    website: 'https://www.enterprise-logistics.co.ke',
  });
  await businessRepository.save(business5);

  const user5 = userRepository.create({
    email: 'ceo@enterprise-logistics.co.ke',
    firstName: 'David',
    lastName: 'Omondi',
    phoneNumber: '+254755667788',
    emailVerified: true,
    businessId: business5.id,
    isSuperAdmin: false,
  });
  await userRepository.save(user5);

  const account5 = accountRepository.create({
    userId: user5.id,
    providerId: 'email',
    providerAccountId: user5.email,
    password: 'hashed_password_david123',
  });
  await accountRepository.save(account5);

  console.log('✅ Created enterprise tier business user (Kenya)');

  console.log('🎉 Business seed data completed successfully!');
  console.log('\n📊 Summary:');
  console.log('- 1 Super Admin (no business)');
  console.log('- 5 Business Users with different statuses:');
  console.log('  • 2 Verified (Premium & Enterprise)');
  console.log('  • 1 Pending KYB');
  console.log('  • 1 In Review');
  console.log('  • 1 Rejected');
}
