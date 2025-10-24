const { Client } = require('pg');
const crypto = require('crypto');

// Encryption logic
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getKey() {
  const key = process.env.EPSOL_KMS_KEY || '9ImnUDLhggB7FXOKRKeW0OF4mk3zTiw2C/7oMOpm9nA=';
  return Buffer.from(key, 'base64');
}

function encrypt(text) {
  if (!text) return '';
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

async function seedDatabase() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    database: 'epsol_indexing',
    user: 'postgres',
    password: 'password',
  });

  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL\n');

    // User credentials
    const email = 'admin@epsol.local';
    const apiKey = 'AIzaSyCvf2r6dXYo1kPyNSOEbmWnfWYFdU_BSOA';
    const cx = '255b32e558aeb42bf';

    // Get or create user
    let userResult = await client.query('SELECT id FROM "User" WHERE email = $1', [email]);
    let userId;

    if (userResult.rows.length === 0) {
      const insertUser = await client.query(
        'INSERT INTO "User" (id, email, "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, NOW(), NOW()) RETURNING id',
        [email]
      );
      userId = insertUser.rows[0].id;
      console.log('✓ Created user:', email);
    } else {
      userId = userResult.rows[0].id;
      console.log('✓ User exists:', email);
    }

    // Add encrypted settings
    const encryptedKey = encrypt(apiKey);
    const encryptedCx = encrypt(cx);

    await client.query(
      `INSERT INTO "Setting" (id, "userId", "googleKey", "googleCx", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, NOW(), NOW())
       ON CONFLICT ("userId")
       DO UPDATE SET "googleKey" = $2, "googleCx" = $3, "updatedAt" = NOW()`,
      [userId, encryptedKey, encryptedCx]
    );
    console.log('✓ API credentials configured\n');

    // Create test campaign
    const campaignResult = await client.query(
      `INSERT INTO "Campaign" (id, "userId", name, "createdAt", status)
       VALUES (gen_random_uuid()::text, $1, $2, NOW(), 'READY')
       RETURNING id`,
      [userId, 'Test Campaign - Epsol Blog URLs']
    );
    const campaignId = campaignResult.rows[0].id;
    console.log('✓ Created campaign: Test Campaign - Epsol Blog URLs');

    // Test URLs
    const testUrls = [
      {
        url: 'https://epsoldev.com/blog/custom-software-vs-off-the-shelf-solutions-which-is-best-for-your-business-in-2025',
        note: 'This URL is INDEXED on Google (verified with site: search)'
      },
      {
        url: 'https://epsoldev.com/blog/how-to-host-n8n-on-hostinger-full-installation-setup-guide-2025',
        note: 'This URL is NOT INDEXED on Google (verified with site: search)'
      },
      {
        url: 'https://epsoldev.com',
        note: 'Main domain - should be indexed'
      },
      {
        url: 'https://www.google.com',
        note: 'Control test - definitely indexed'
      },
      {
        url: 'https://example-does-not-exist-12345.com/test-page',
        note: 'Control test - definitely not indexed (fake domain)'
      }
    ];

    console.log('\n✓ Adding test URLs:');
    for (const item of testUrls) {
      await client.query(
        `INSERT INTO "UrlItem" (id, "campaignId", url, status, "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, 'NOT_FETCHED', NOW())`,
        [campaignId, item.url]
      );
      console.log(`  - ${item.url}`);
      console.log(`    (${item.note})`);
    }

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   User: ${email}`);
    console.log(`   Campaign: Test Campaign - Epsol Blog URLs`);
    console.log(`   URLs: ${testUrls.length} test URLs added`);
    console.log('\n🚀 Next Steps:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Open: http://localhost:3000');
    console.log('   3. Sign in with: admin@epsol.local');
    console.log('   4. Go to the test campaign');
    console.log('   5. Click "Recheck All" to test the index checker');
    console.log('\n💡 Expected Results:');
    console.log('   ✅ URL 1 (custom-software...) → INDEXED');
    console.log('   ❌ URL 2 (how-to-host-n8n...) → NOT INDEXED');
    console.log('   ✅ URL 3 (epsoldev.com) → INDEXED');
    console.log('   ✅ URL 4 (google.com) → INDEXED');
    console.log('   ❌ URL 5 (fake domain) → ERROR or NOT INDEXED');

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedDatabase();
