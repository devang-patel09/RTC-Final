const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Project = require('../models/Project');

async function migrate() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    const users = await User.find({ organizationId: { $exists: false } });
    console.log(`Found ${users.length} users without organization`);

    for (const user of users) {
      const slug = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const org = await Organization.create({
        name: `${user.fullName}'s Organization`,
        slug: `${slug}-${Date.now()}`,
        owner: user._id,
        plan: 'free',
        status: 'active',
      });

      user.organizationId = org._id;
      await user.save();

      await Project.updateMany(
        { owner: user._id },
        { organizationId: org._id }
      );

      console.log(`Created org "${org.name}" for ${user.email}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
