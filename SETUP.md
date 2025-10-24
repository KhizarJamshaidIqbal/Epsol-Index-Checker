# Epsol Index Checker - Complete Setup Guide

## 🚀 Quick Start (Local Machine with Internet)

### Prerequisites
- Node.js 18+
- PostgreSQL 12+ (running)
- Internet connection

### Step-by-Step Setup

#### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd Epsol-Index-Checker
npm install
```

#### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your details:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-here

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/epsol_indexing

# Redis (optional - leave commented if not using)
# REDIS_URL=redis://localhost:6379

# Encryption key (generate new one below)
EPSOL_KMS_KEY=your-32-byte-base64-key-here
```

**Generate encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### 3. Set Up PostgreSQL Database

```bash
# Create database
createdb epsol_indexing

# Or using psql:
psql -U postgres -c "CREATE DATABASE epsol_indexing;"
```

#### 4. Run Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run migration
node scripts/migrate.js
```

#### 5. Seed Test Data (Recommended)

This adds your test URLs automatically:

```bash
node scripts/seed-database.js
```

**Test URLs included:**
- ✅ `https://epsoldev.com/blog/custom-software-vs-off-the-shelf-solutions...` (INDEXED)
- ❌ `https://epsoldev.com/blog/how-to-host-n8n-on-hostinger...` (NOT INDEXED)
- ✅ `https://epsoldev.com` (INDEXED)
- ✅ `https://www.google.com` (INDEXED)
- ❌ `https://example-does-not-exist-12345.com/test-page` (NOT INDEXED)

#### 6. Start the Development Server

```bash
npm run dev
```

Server will start at: **http://localhost:3000**

#### 7. Access the Application

1. Open browser: **http://localhost:3000**
2. Sign in with: `admin@epsol.local`
3. Go to "Test Campaign - Epsol Blog URLs"
4. Click **"Recheck All"** to test the system

---

## 🧪 Testing the System

### Manual Test via UI

1. Go to http://localhost:3000
2. Sign in (email: `admin@epsol.local`)
3. Open "Test Campaign - Epsol Blog URLs"
4. Click "Recheck All"
5. Watch real-time results

**Expected Results:**
- epsoldev.com/custom-software... → **INDEXED** ✅
- epsoldev.com/how-to-host-n8n... → **NOT INDEXED** ❌
- epsoldev.com → **INDEXED** ✅
- google.com → **INDEXED** ✅
- fake-domain → **ERROR/NOT INDEXED** ❌

### Automated System Test

```bash
node scripts/test-system.js
```

This will:
- Connect to the database
- Load API credentials
- Check all test URLs against Google
- Display results in console
- Update database with results

---

## 📊 Google API Configuration

Your credentials are **already configured** in the database:

- **API Key**: `AIzaSyCvf2r6dXYo1kPyNSOEbmWnfWYFdU_BSOA`
- **Search Engine ID (CX)**: `255b32e558aeb42bf`

These are encrypted and stored securely.

### Verify API Configuration

In the app:
1. Go to **Settings**
2. You should see: "API Key: Currently set ✓"
3. You should see: "CX: Currently set ✓"

---

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npx prisma studio        # Visual database browser
npx prisma generate      # Generate Prisma client
node scripts/migrate.js  # Run migrations manually

# Seeding & Testing
node scripts/seed-database.js    # Add test data
node scripts/test-system.js      # Test index checker
node scripts/add-credentials.js  # Re-add credentials

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier
```

---

## 🔍 Troubleshooting

### Issue: "localhost refused to connect"

**Solution:**
- Server must be running: `npm run dev`
- Check if port 3000 is available
- Try: `curl http://localhost:3000`

### Issue: "Module not found: @prisma/client"

**Solution:**
```bash
npm install
npx prisma generate
```

### Issue: "Database connection failed"

**Solution:**
```bash
# Check PostgreSQL is running
service postgresql status

# Test connection
psql -U postgres -d epsol_indexing -c "SELECT 1;"
```

### Issue: "Failed to fetch engine"

**Solution:**
This happens in offline environments. If you have internet:
```bash
rm -rf node_modules/.prisma
npx prisma generate
```

### Issue: "API credentials not working"

**Solution:**
```bash
# Re-add credentials
node scripts/add-credentials.js

# Verify in database
psql -U postgres -d epsol_indexing -c \
  "SELECT 'googleKey' as key, LENGTH("googleKey") as len FROM \"Setting\";"
```

---

## 📁 Database Schema

```
User
├── id (primary key)
├── email (unique)
├── name
├── campaigns (relation)
└── settings (relation)

Setting
├── id (primary key)
├── userId (foreign key → User.id)
├── googleKey (encrypted)
└── googleCx (encrypted)

Campaign
├── id (primary key)
├── userId (foreign key → User.id)
├── name
├── status (READY | RUNNING | COMPLETE)
└── items (relation)

UrlItem
├── id (primary key)
├── campaignId (foreign key → Campaign.id)
├── url
├── status (NOT_FETCHED | INDEXED | NOT_INDEXED | ERROR)
├── title
├── snippet
├── reason
└── checkedAt
```

---

## 🌐 Production Deployment

### Environment Setup

1. **Set Production Environment Variables:**

```env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<generate-strong-secret>
DATABASE_URL=postgresql://user:pass@host:5432/epsol
REDIS_URL=redis://host:6379
EPSOL_KMS_KEY=<generate-new-key>
```

2. **Deploy to Vercel/Railway:**

```bash
npm run build
npm run start
```

3. **Run Migration:**

```bash
npx prisma migrate deploy
```

---

## 💡 How It Works

### Index Checking Process

1. User adds URLs to a campaign
2. Clicks "Recheck All"
3. System enqueues jobs for each URL
4. Worker processes jobs:
   - Queries Google Programmable Search API
   - Looks for exact URL match in results
   - Updates database with status
5. Frontend polls for updates every 5 seconds
6. Shows results in real-time

### API Query Format

For URL: `https://example.com/page`

**Query:** `"https://example.com/page"`

**API Endpoint:**
```
https://www.googleapis.com/customsearch/v1
?key=YOUR_API_KEY
&cx=YOUR_CX
&q="https://example.com/page"
&num=3
```

**Matching Logic:**
- Exact match required (ignoring trailing slash)
- `items[].link === url` → **INDEXED**
- No match → **NOT INDEXED**
- API error → **ERROR**

---

## 🔒 Security Notes

- API credentials are encrypted with AES-256-GCM
- Encryption key stored in environment variable
- Never exposed to client-side code
- All API routes require authentication
- Rate limiting on all endpoints

---

## 📞 Support

For issues:
1. Check troubleshooting section above
2. Review logs: `.next` folder or console
3. Test database connection
4. Verify API credentials in Google Cloud Console

---

## ✅ Success Checklist

- [ ] PostgreSQL installed and running
- [ ] Database created: `epsol_indexing`
- [ ] Dependencies installed: `npm install`
- [ ] Prisma generated: `npx prisma generate`
- [ ] Database migrated: `node scripts/migrate.js`
- [ ] Test data seeded: `node scripts/seed-database.js`
- [ ] Server running: `npm run dev`
- [ ] Accessible at: http://localhost:3000
- [ ] Can sign in with: `admin@epsol.local`
- [ ] Test campaign visible
- [ ] "Recheck All" works
- [ ] Results show correctly

---

**Your Epsol Index Checker is ready to use!** 🎉
