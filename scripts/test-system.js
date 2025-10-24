const { Client } = require('pg');
const crypto = require('crypto');

// Encryption logic
const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const key = process.env.EPSOL_KMS_KEY || '9ImnUDLhggB7FXOKRKeW0OF4mk3zTiw2C/7oMOpm9nA=';
  return Buffer.from(key, 'base64');
}

function decrypt(encryptedText) {
  if (!encryptedText) return '';
  const key = getKey();
  const parts = encryptedText.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted data format');

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Checker logic (same as lib/checker.ts)
async function checkIndexExact(url, key, cx) {
  if (!key || !cx) {
    return { status: 'ERROR', title: '', snippet: '', reason: 'Missing Google API credentials' };
  }

  try {
    const q = `"${url}"`;
    const endpoint = new URL('https://www.googleapis.com/customsearch/v1');
    endpoint.searchParams.set('key', key);
    endpoint.searchParams.set('cx', cx);
    endpoint.searchParams.set('q', q);
    endpoint.searchParams.set('num', '3');

    console.log(`  🔍 Checking: ${url.substring(0, 60)}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(endpoint.toString(), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `API error: ${res.status}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) errorMessage = errorData.error.message;
        } catch {}
        return { status: 'ERROR', title: '', snippet: '', reason: errorMessage.slice(0, 200) };
      }

      const data = await res.json();
      const items = data.items ?? [];
      const normalizedUrl = url.replace(/\/$/, '');
      const match = items.find((item) => {
        const itemLink = item?.link?.replace(/\/$/, '');
        return itemLink === normalizedUrl;
      });

      if (match) {
        return {
          status: 'INDEXED',
          title: (match.title ?? '').slice(0, 500),
          snippet: (match.snippet ?? '').replace(/\n/g, ' ').slice(0, 500),
          reason: null,
        };
      }

      return {
        status: 'NOT_INDEXED',
        title: '',
        snippet: '',
        reason: 'No exact match found in Google results',
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.name === 'AbortError' ? 'Request timeout (15s)' : error.message;
    }
    return { status: 'ERROR', title: '', snippet: '', reason: errorMessage.slice(0, 200) };
  }
}

async function testSystem() {
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

    // Get user settings
    const settingsResult = await client.query(
      'SELECT "googleKey", "googleCx" FROM "Setting" WHERE "userId" = (SELECT id FROM "User" WHERE email = $1)',
      ['admin@epsol.local']
    );

    if (settingsResult.rows.length === 0) {
      console.error('❌ No settings found for user');
      process.exit(1);
    }

    const { googleKey, googleCx } = settingsResult.rows[0];
    const apiKey = decrypt(googleKey);
    const cx = decrypt(googleCx);

    console.log('✓ API Credentials loaded\n');
    console.log('🧪 Testing Google Index Checker\n');
    console.log('─'.repeat(80));

    // Get test URLs from campaign
    const urlsResult = await client.query(
      `SELECT id, url FROM "UrlItem"
       WHERE "campaignId" = (SELECT id FROM "Campaign" WHERE name = 'Test Campaign - Epsol Blog URLs')
       ORDER BY "createdAt"`
    );

    const results = [];
    for (const row of urlsResult.rows) {
      const result = await checkIndexExact(row.url, apiKey, cx);

      const statusIcon =
        result.status === 'INDEXED' ? '✅' :
        result.status === 'NOT_INDEXED' ? '❌' :
        '⚠️ ';

      console.log(`  ${statusIcon} ${result.status}`);
      if (result.title) console.log(`     Title: ${result.title.substring(0, 80)}...`);
      if (result.reason) console.log(`     Reason: ${result.reason}`);
      console.log();

      results.push({ url: row.url, ...result });

      // Update database
      await client.query(
        `UPDATE "UrlItem" SET status = $1, title = $2, snippet = $3, reason = $4, "checkedAt" = NOW()
         WHERE id = $5`,
        [result.status, result.title || null, result.snippet || null, result.reason || null, row.id]
      );
    }

    console.log('─'.repeat(80));
    console.log('\n📊 Test Results Summary:\n');

    const indexed = results.filter(r => r.status === 'INDEXED').length;
    const notIndexed = results.filter(r => r.status === 'NOT_INDEXED').length;
    const errors = results.filter(r => r.status === 'ERROR').length;

    console.log(`   Total URLs tested: ${results.length}`);
    console.log(`   ✅ Indexed: ${indexed}`);
    console.log(`   ❌ Not Indexed: ${notIndexed}`);
    console.log(`   ⚠️  Errors: ${errors}`);

    console.log('\n✅ System test completed!');
    console.log('\n💡 You can now:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. View results at: http://localhost:3000');
    console.log('   3. Sign in with: admin@epsol.local');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.log('⚠️  fetch not available - installing node-fetch...');
  require('child_process').execSync('npm install node-fetch@2', { stdio: 'inherit' });
  global.fetch = require('node-fetch');
}

testSystem();
