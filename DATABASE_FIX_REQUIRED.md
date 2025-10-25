# 🚨 CRITICAL: Database Connection Issue

## The Problem

Your Vercel deployment **cannot connect** to your PostgreSQL database:

```
Can't reach database server at `69.57.161.70:5432`
```

**Root Cause:** Your database server is blocking connections from Vercel's IP addresses.

---

## ✅ Solution 1: Use Vercel Postgres (RECOMMENDED - Easiest)

### Why Vercel Postgres?
- ✅ **Works instantly** with Vercel deployments
- ✅ **No firewall issues**
- ✅ **Automatic connection pooling**
- ✅ **Free tier available** (60 hours compute/month)
- ✅ **Built-in backup & monitoring**

### Steps:

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Click your project: **epsol-index-checker**

2. **Create Postgres Database:**
   - Click **Storage** tab
   - Click **Create Database**
   - Select **Postgres**
   - Choose region closest to you
   - Click **Create**

3. **Auto-Configuration:**
   - Vercel will automatically set `DATABASE_URL`
   - No manual configuration needed!

4. **Migrate Your Data:**

   **Option A: Export & Import (Simple)**
   ```bash
   # On your local machine, dump existing database
   pg_dump -h 69.57.161.70 -U epsol_user -d epsol_indexing > backup.sql
   
   # Import to Vercel Postgres (get connection string from Vercel dashboard)
   psql "YOUR_VERCEL_POSTGRES_URL" < backup.sql
   ```

   **Option B: Use Prisma Migrate (Clean start)**
   ```bash
   # This will create fresh tables
   npx prisma migrate deploy
   ```

5. **Redeploy:**
   - Changes will auto-deploy
   - Test authentication!

---

## ✅ Solution 2: Use Connection Pooler (Keep Current Database)

If you MUST keep your current database at `69.57.161.70`, use a connection pooler:

### Using Prisma Accelerate:

1. **Sign up for Prisma Accelerate:**
   - https://www.prisma.io/data-platform/accelerate
   - Free tier available

2. **Get your connection string:**
   ```
   prisma://accelerate.prisma-data.net/?api_key=YOUR_API_KEY
   ```

3. **Update Vercel environment variable:**
   ```
   DATABASE_URL = prisma://accelerate.prisma-data.net/?api_key=YOUR_API_KEY
   ```

4. **Install Prisma Accelerate extension:**
   ```bash
   npm install @prisma/extension-accelerate
   ```

5. **Update `lib/prisma.ts`:**
   ```typescript
   import { PrismaClient } from '@prisma/client'
   import { withAccelerate } from '@prisma/extension-accelerate'

   const globalForPrisma = globalThis as unknown as {
     prisma: PrismaClient | undefined
   }

   export const prisma = globalForPrisma.prisma ?? 
     new PrismaClient().$extends(withAccelerate())

   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
   ```

---

## ✅ Solution 3: Whitelist Vercel IPs (Complex)

### Step 1: Get Vercel IP Ranges

Vercel uses dynamic IPs from these providers:
- AWS (various regions)
- Google Cloud
- Cloudflare

**Problem:** Vercel doesn't provide a static IP list!

### Step 2: Alternative - Use Static Outbound IP

Vercel Pro/Enterprise offers static IPs, but requires paid plan.

### Step 3: Configure Database Firewall

This depends on your hosting provider. Generally:

1. Find database firewall settings
2. Add IP ranges (this is impractical for Vercel)
3. Or allow connections from "any IP" (NOT recommended for security)

**We don't recommend this approach!**

---

## 🚀 Quick Start: Resend Email Setup (ALSO REQUIRED)

Since you installed Resend, let's configure it:

### 1. Get Resend API Key:

1. Go to: https://resend.com
2. Sign up for free account
3. Go to: **API Keys**
4. Click **Create API Key**
5. Copy the key (starts with `re_...`)

### 2. Add to Vercel Environment Variables:

```
RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Configure Email Domain (Optional but Recommended):

**Option A: Use Resend's Test Domain (Quick)**
```
EMAIL_FROM = onboarding@resend.dev
```

**Option B: Use Your Own Domain (Production)**
1. Add domain in Resend dashboard
2. Add DNS records as instructed
3. Verify domain
4. Use: `EMAIL_FROM = noreply@yourdomain.com`

### 4. Remove Old Email Variables (No longer needed):

These can be deleted from Vercel:
- ❌ `EMAIL_SERVER_HOST`
- ❌ `EMAIL_SERVER_PORT`
- ❌ `EMAIL_SERVER_USER`
- ❌ `EMAIL_SERVER_PASSWORD`

Keep this:
- ✅ `EMAIL_FROM`

---

## 📋 Complete Environment Variables Checklist

After fixing database, your Vercel env vars should be:

```
☐ DATABASE_URL = (Vercel Postgres connection string OR Prisma Accelerate URL)
☐ NEXTAUTH_URL = https://epsol-index-checker.vercel.app
☐ NEXTAUTH_SECRET = (your generated secret)
☐ RESEND_API_KEY = re_xxxxxxxxxxxxx
☐ EMAIL_FROM = onboarding@resend.dev (or your domain)
☐ EPSOL_KMS_KEY = 9ImnUDLhggB7FXOKRKeW0OF4mk3zTiw2C/7oMOpm9nA=
```

---

## 🎯 Recommended Path (Fastest):

1. ✅ **Create Vercel Postgres database** (5 minutes)
2. ✅ **Run Prisma migrations** to create tables
3. ✅ **Add RESEND_API_KEY** to Vercel
4. ✅ **Update EMAIL_FROM** to use Resend domain
5. ✅ **Redeploy**
6. ✅ **Test authentication!**

---

## 💡 Why This Happens:

| Service | Your Setup | Issue |
|---------|------------|-------|
| **Database** | External server at `69.57.161.70` | Firewall blocks Vercel IPs |
| **Email** | Your SMTP server | Likely also blocked |

**Solution:** Use Vercel-friendly services (Vercel Postgres + Resend)

---

## 🔍 Testing After Fix:

### 1. Check Database Connection:
```
https://epsol-index-checker.vercel.app/api/debug/env
```

Should show:
```json
{
  "DATABASE_URL": true
}
```

### 2. Check Function Logs:
- Go to Vercel → Deployments → Latest → View Function Logs
- Try to sign in
- Should NOT see database connection errors

### 3. Test Sign In:
- Go to: https://epsol-index-checker.vercel.app/auth/signin
- Enter email
- Should receive email via Resend
- Click magic link
- Should sign in successfully ✅

---

## ⏱️ Time Estimates:

- **Vercel Postgres Setup:** 5-10 minutes
- **Resend Setup:** 5 minutes
- **Testing:** 2 minutes
- **Total:** ~15-20 minutes

---

## 🆘 Still Need Help?

If you choose Vercel Postgres and need help with data migration:

1. Export your current database schema
2. Show me the schema
3. I'll help you migrate the data

If you prefer to keep your current database:

1. We'll set up Prisma Accelerate
2. It acts as a proxy between Vercel and your database
3. Takes about 10 minutes

---

**Choose your path and let's fix this!** 🚀
