const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedUsers = [
  {
    name: 'Alice Manager',
    email: 'fleet@driveops.com',
    password: 'fleet1234',
    role: 'fleet_manager',
  },
  {
    name: 'Bob Driver',
    email: 'driver@driveops.com',
    password: 'driver1234',
    role: 'driver',
  },
  {
    name: 'Carol Safety',
    email: 'safety@driveops.com',
    password: 'safety1234',
    role: 'safety_officer',
  },
  {
    name: 'Dave Finance',
    email: 'finance@driveops.com',
    password: 'finance1234',
    role: 'financial_analyst',
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Remove existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Hash passwords and insert users
    const hashedUsers = await Promise.all(
      seedUsers.map(async (u) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(u.password, salt);
        return { ...u, password: hashedPassword };
      })
    );

    await User.insertMany(hashedUsers);
    console.log('🌱 Seeded users successfully!\n');

    console.log('──────────────────────────────────────────────');
    console.log('  LOGIN CREDENTIALS');
    console.log('──────────────────────────────────────────────');
    seedUsers.forEach((u) => {
      console.log(`  Role   : ${u.role}`);
      console.log(`  Email  : ${u.email}`);
      console.log(`  Password: ${u.password}`);
      console.log('──────────────────────────────────────────────');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDB();
