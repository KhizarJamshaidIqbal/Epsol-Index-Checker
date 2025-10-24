const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    database: 'epsol_indexing',
    user: 'postgres',
    password: 'password',
  });

  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL');

    const sql = fs.readFileSync(
      path.join(__dirname, '../prisma/migrations/0_init/migration.sql'),
      'utf8'
    );

    await client.query(sql);
    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
