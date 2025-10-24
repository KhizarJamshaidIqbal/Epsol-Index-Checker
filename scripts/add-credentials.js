const { Client } = require('pg');
const crypto = require('crypto');

// Same encryption logic as in lib/crypto.ts
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey() {
  const key = process.env.EPSOL_KMS_KEY || 'dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcwo=';
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

async function addCredentials() {
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

    const email = 'admin@epsol.local';
    const apiKey = 'AIzaSyCvf2r6dXYo1kPyNSOEbmWnfWYFdU_BSOA';
    const cx = '255b32e558aeb42bf';

    // Check if user exists
    let userResult = await client.query('SELECT id FROM "User" WHERE email = $1', [email]);
    let userId;

    if (userResult.rows.length === 0) {
      // Create user
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

    // Encrypt credentials
    const encryptedKey = encrypt(apiKey);
    const encryptedCx = encrypt(cx);

    // Upsert settings
    await client.query(
      `INSERT INTO "Setting" (id, "userId", "googleKey", "googleCx", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, NOW(), NOW())
       ON CONFLICT ("userId")
       DO UPDATE SET "googleKey" = $2, "googleCx" = $3, "updatedAt" = NOW()`,
      [userId, encryptedKey, encryptedCx]
    );

    console.log('✓ Credentials added and encrypted\n');
    console.log('📋 Login Information:');
    console.log('   Email:', email);
    console.log('   API Key: ***' + apiKey.substring(apiKey.length - 4));
    console.log('   CX:', cx);
    console.log('\n✅ Setup complete!');
    console.log('\nYou can now:');
    console.log('1. Go to http://localhost:3000');
    console.log('2. Sign in with:', email);
    console.log('3. Start creating campaigns!');

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addCredentials();
