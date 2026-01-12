require('dotenv').config();
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;

async function check() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected successfully!\n');

    // Check all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('All collections in database:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    console.log('\n--- Checking "profile" collection ---');
    const db = mongoose.connection.db;
    const profileCollection = db.collection('profile');
    const profileDocs = await profileCollection.find({}).toArray();
    console.log(`Found ${profileDocs.length} documents in "profile" collection`);
    
    if (profileDocs.length > 0) {
      console.log('\nSample documents:');
      profileDocs.slice(0, 3).forEach(doc => {
        console.log(`User: ${doc.userID}`);
        console.log(`consumedTomes:`, doc.consumedTomes);
        console.log(`Raw doc:`, JSON.stringify(doc, null, 2));
        console.log('---');
      });
    }

    await mongoose.disconnect();
    console.log('\n✓ Done');

  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

check();
