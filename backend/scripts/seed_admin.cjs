require('dotenv').config();
const mongoose = require('mongoose');
const argon2 = require('argon2');

async function seedInitialData() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_billing_erp';
  console.log(`Connecting to MongoDB at: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);
  await mongoose.connect(mongoUri);

  const usersCollection = mongoose.connection.collection('users');
  const orgsCollection = mongoose.connection.collection('organizations');
  const rolesCollection = mongoose.connection.collection('roles');
  const firmsCollection = mongoose.connection.collection('firms');
  const companyUsersCollection = mongoose.connection.collection('companyusers');
  const fiscalPeriodsCollection = mongoose.connection.collection('fiscalperiods');
  const taxPoliciesCollection = mongoose.connection.collection('taxpolicies');
  const unitsCollection = mongoose.connection.collection('units');
  const warehousesCollection = mongoose.connection.collection('warehouses');

  // Check if admin already exists
  let adminUser = await usersCollection.findOne({ email: 'admin@smartbilling.com' });

  if (!adminUser) {
    const passwordHash = await argon2.hash('Admin@123456');
    const adminDoc = {
      fullName: 'Chief Executive Administrator',
      email: 'admin@smartbilling.com',
      phone: '+977-9800000001',
      passwordHash,
      mfa: { enabled: false },
      isSuperAdmin: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await usersCollection.insertOne(adminDoc);
    adminUser = { _id: result.insertedId, ...adminDoc };
    console.log('✅ Created User: admin@smartbilling.com');
  } else {
    console.log('ℹ️ User admin@smartbilling.com already exists.');
  }

  // Create Default Organization
  let org = await orgsCollection.findOne({ slug: 'himalayan-enterprises' });
  if (!org) {
    const orgDoc = {
      name: 'Himalayan Enterprises Pvt. Ltd.',
      legalName: 'Himalayan Enterprises Private Limited',
      panNumber: '601234567',
      slug: 'himalayan-enterprises',
      settings: {
        currency: 'NPR',
        dateFormat: 'YYYY-MM-DD',
        calendarSystem: 'bikram_sambat',
        negativeStockAllowed: false,
        taxType: 'VAT',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const orgRes = await orgsCollection.insertOne(orgDoc);
    org = { _id: orgRes.insertedId, ...orgDoc };
    console.log('✅ Created Organization: Himalayan Enterprises Pvt. Ltd.');

    // Owner Role
    const ownerRoleRes = await rolesCollection.insertOne({
      organizationId: org._id,
      name: 'Owner',
      isSystem: true,
      permissions: ['*'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Main Firm
    const firmRes = await firmsCollection.insertOne({
      organizationId: org._id,
      name: 'Himalayan Enterprises - Head Office',
      code: 'HQ',
      isHeadOffice: true,
      address: {
        line1: 'Durbar Marg',
        city: 'Kathmandu',
        district: 'Kathmandu',
        province: 'Bagmati',
      },
      phone: '+977-1-4400000',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Link Admin as Active Company User
    await companyUsersCollection.insertOne({
      organizationId: org._id,
      userId: adminUser._id,
      roleId: ownerRoleRes.insertedId,
      assignedFirmIds: [firmRes.insertedId],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Fiscal Period (2081/2082)
    await fiscalPeriodsCollection.insertOne({
      organizationId: org._id,
      name: 'FY 2081/82',
      startDate: new Date('2024-07-16'),
      endDate: new Date('2025-07-15'),
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Tax Policy
    await taxPoliciesCollection.insertOne({
      organizationId: org._id,
      name: 'Nepal VAT 13%',
      jurisdiction: 'NP',
      taxType: 'VAT',
      rate: mongoose.Types.Decimal128.fromString('13.00'),
      isInclusive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Units
    await unitsCollection.insertMany([
      { organizationId: org._id, name: 'Pieces', abbreviation: 'PCS', isSystem: true },
      { organizationId: org._id, name: 'Kilograms', abbreviation: 'KG', isSystem: true },
      { organizationId: org._id, name: 'Bags', abbreviation: 'BAG', isSystem: true },
    ]);

    // Central Warehouse
    await warehousesCollection.insertOne({
      organizationId: org._id,
      name: 'Central Logistics Hub - Kathmandu',
      code: 'WH-KTM-01',
      address: {
        line1: 'Kalanki Ring Road',
        city: 'Kathmandu',
        district: 'Kathmandu',
        province: 'Bagmati',
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Created Firm, Fiscal Period, Nepal VAT Policy, Units & Central Warehouse');
  }

  console.log('\n=============================================================');
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('Email:     admin@smartbilling.com');
  console.log('Password:  Admin@123456');
  console.log('=============================================================\n');

  await mongoose.disconnect();
}

seedInitialData().catch(err => {
  console.error(err);
  process.exit(1);
});
