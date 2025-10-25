# 📦 Data Transfer Guide: Local PostgreSQL → Neon

This guide will help you transfer your local PostgreSQL data to Neon.tech.

---

## ✅ Prerequisites

- Local PostgreSQL database with existing data
- Neon account with database created
- Your Neon connection string

---

## 🚀 Method 1: Using Transfer Script (Recommended)

### Step 1: Update Environment Variables

Create a temporary `.env.transfer` file:

```env
# Your LOCAL PostgreSQL database
LOCAL_DATABASE_URL=postgresql://epsol_user:epsol_password%40786@69.57.161.70:5432/epsol_indexing

# Your NEON database (from Neon console)
DATABASE_URL=postgresql://neondb_owner:npg_BVOXGNTh5u2y@ep-autumn-cloud-adiizixl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Step 2: Push Schema to Neon

First, make sure your `.env` file has the **Neon DATABASE_URL**, then:

```bash
npx prisma migrate deploy
```

This creates all tables in Neon.

### Step 3: Run Transfer Script

```bash
# Using the transfer env file
set LOCAL_DATABASE_URL=postgresql://epsol_user:epsol_password%40786@69.57.161.70:5432/epsol_indexing
set DATABASE_URL=postgresql://neondb_owner:npg_BVOXGNTh5u2y@ep-autumn-cloud-adiizixl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

node scripts/transfer-to-neon.js
```

**The script will:**
- ✅ Transfer all users
- ✅ Transfer all settings (encrypted API keys)
- ✅ Transfer all campaigns
- ✅ Transfer all URL items with their status
- ✅ Preserve all relationships

---

## 🔄 Method 2: Using pg_dump & psql

### Step 1: Export Local Data

```bash
# Export only data (not schema)
pg_dump -U postgres -h localhost -d epsol_indexing --data-only --no-owner --no-privileges -f data_export.sql
```

### Step 2: Import to Neon

First, push schema:
```bash
npx prisma migrate deploy
```

Then import data:
```bash
psql "postgresql://neondb_owner:npg_BVOXGNTh5u2y@ep-autumn-cloud-adiizixl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" -f data_export.sql
```

---

## 🛠️ Method 3: Manual via Prisma Studio

If you have a small dataset:

### Step 1: Export from Local

```bash
# Set to local database
$env:DATABASE_URL="postgresql://epsol_user:epsol_password%40786@69.57.161.70:5432/epsol_indexing"
npx prisma studio
```

- Open Prisma Studio
- Copy your data (users, campaigns, URLs)

### Step 2: Import to Neon

```bash
# Set to Neon database
$env:DATABASE_URL="postgresql://neondb_owner:npg_BVOXGNTh5u2y@ep-autumn-cloud-adiizixl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
npx prisma studio
```

- Paste your data into Neon

---

## ✨ Quick Transfer (Recommended Steps)

### 1. Backup your local database first

```bash
pg_dump -U postgres -d epsol_indexing -F c -f backup_before_transfer.dump
```

### 2. Update .env to point to Neon

```env
DATABASE_URL=postgresql://neondb_owner:npg_BVOXGNTh5u2y@ep-autumn-cloud-adiizixl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 3. Push schema to Neon

```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. Transfer data

```bash
# Set both database URLs
$env:LOCAL_DATABASE_URL="postgresql://epsol_user:epsol_password%40786@69.57.161.70:5432/epsol_indexing"
$env:DATABASE_URL="postgresql://neondb_owner:npg_BVOXGNTh5u2y@ep-autumn-cloud-adiizixl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Run transfer
node scripts/transfer-to-neon.js
```

### 5. Verify in Neon Console

Go to [Neon Console](https://console.neon.tech) and check your tables have data.

---

## 🔍 Troubleshooting

### Issue: "Connection refused" to local database

Make sure PostgreSQL is running:
```bash
# Check if running
pg_isready

# Start if not running
# On Windows with PostgreSQL installed:
net start postgresql-x64-15
```

### Issue: "SSL required" error with Neon

Make sure your Neon connection string has `?sslmode=require` at the end.

### Issue: "Migration failed" 

Try pushing with force:
```bash
npx prisma db push --force-reset
```

**⚠️ WARNING**: This will delete existing Neon data!

---

## 📊 Verify Transfer

After transfer, check counts match:

```bash
# Check local
$env:DATABASE_URL="postgresql://epsol_user:epsol_password%40786@69.57.161.70:5432/epsol_indexing"
npx prisma studio

# Check Neon
$env:DATABASE_URL="postgresql://neondb_owner:npg_BVOXGNTh5u2y@ep-autumn-cloud-adiizixl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
npx prisma studio
```

Compare:
- ✅ Number of users
- ✅ Number of campaigns
- ✅ Number of URLs
- ✅ Settings preserved

---

## 🎉 Success!

Once transferred, update your production `.env` to use Neon:

```env
DATABASE_URL=postgresql://neondb_owner:npg_BVOXGNTh5u2y@ep-autumn-cloud-adiizixl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

And redeploy to Vercel! Your data is now in the cloud! ☁️
