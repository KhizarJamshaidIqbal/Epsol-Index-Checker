# Deployment Guide - Epsol Index Checker

## 🚀 Deploy to Vercel + Neon PostgreSQL

### Prerequisites
- GitHub account
- Vercel account (free)
- Neon account (free)

---

## Step 1: Set Up Database (Neon)

1. Go to [neon.tech](https://neon.tech)
2. Sign up for free account
3. Click **"Create Project"**
4. Choose:
   - Project name: `epsol-index-checker`
   - Region: Choose closest to your users
   - PostgreSQL version: 16 (latest)
5. Click **"Create Project"**
6. Copy your connection string - it looks like:
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
7. **Save this for later!**

---

## Step 2: Push Code to GitHub

### If you haven't initialized git yet:

```bash
# Navigate to project directory
cd "c:\Users\KhizarJamshaidIqbal\Documents\F Drive\khizarjamshaidiqbal\Epsol-Index-Checker"

# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Epsol Index Checker"
```

### Create GitHub Repository:

1. Go to [github.com](https://github.com)
2. Click **"New repository"**
3. Name: `epsol-index-checker`
4. Keep it **Private** (recommended)
5. **DO NOT** initialize with README
6. Click **"Create repository"**

### Push to GitHub:

```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/epsol-index-checker.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login (use GitHub account)
3. Click **"Add New Project"**
4. Import your repository: `epsol-index-checker`
5. Click **"Import"**

### Configure Project:

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./`
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)

### Add Environment Variables:

Click **"Environment Variables"** and add these:

1. **DATABASE_URL**
   - Value: Your Neon connection string
   - Example: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`

2. **NEXTAUTH_URL**
   - Value: `https://your-project.vercel.app` (you'll get this after deploy)
   - Or use your custom domain

3. **NEXTAUTH_SECRET**
   - Generate one: Run this in terminal:
     ```bash
     openssl rand -base64 32
     ```
   - Or use: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

4. **REDIS_URL** (Optional - for queue)
   - Leave empty for in-memory queue
   - Or use free Redis from Upstash

Click **"Deploy"**

---

## Step 4: Run Database Migrations

After first deployment:

1. Go to your Vercel project
2. Click **"Settings"** → **"Functions"**
3. Or use Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Run migration
vercel env pull .env.production
npx prisma migrate deploy
```

**Or manually:**
1. In Vercel dashboard → Project → Settings → Environment Variables
2. Add all variables to your local `.env` file
3. Run: `npx prisma migrate deploy`

---

## Step 5: Update NEXTAUTH_URL

1. After deployment, Vercel gives you a URL like: `https://epsol-index-checker.vercel.app`
2. Go back to **Environment Variables**
3. Update **NEXTAUTH_URL** with your actual URL
4. Redeploy

---

## Step 6: Test Your Deployment

1. Visit your Vercel URL
2. Try to sign in (magic link will be sent)
3. Create a test campaign
4. Verify everything works!

---

## 🎯 Post-Deployment

### Add Custom Domain (Optional)

1. In Vercel project → **Settings** → **Domains**
2. Add your Namecheap domain
3. Update Namecheap DNS:
   - Type: `CNAME`
   - Name: `@` or `www`
   - Value: `cname.vercel-dns.com`

### Enable Analytics (Free)

1. Vercel project → **Analytics**
2. Enable Web Analytics
3. Track visitors and performance

---

## 🔧 Environment Variables Reference

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-random-secret"

# Email (configured in code)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email"
EMAIL_SERVER_PASSWORD="your-password"
EMAIL_FROM="noreply@example.com"

# Redis (optional)
REDIS_URL=""
```

---

## 📝 Troubleshooting

### Build Fails
- Check build logs in Vercel
- Verify all dependencies in package.json
- Make sure TypeScript has no errors

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Neon dashboard for connection string
- Ensure sslmode=require is in URL

### Authentication Not Working
- Verify NEXTAUTH_URL matches deployment URL
- Check NEXTAUTH_SECRET is set
- Test email server configuration

---

## 🎉 You're Done!

Your app should now be live at: `https://your-project.vercel.app`

Enjoy your deployed Epsol Index Checker! 🚀
