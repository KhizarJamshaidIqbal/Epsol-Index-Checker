# 🚀 Vercel Production Setup Guide

## Problem: Email Authentication Not Working on Vercel

Your app works fine locally but fails on Vercel because **environment variables are not configured** in the production environment.

---

## ✅ Solution: Configure Environment Variables on Vercel

### Step 1: Go to Vercel Dashboard

1. Open https://vercel.com
2. Sign in to your account
3. Select your project: **epsol-index-checker**

### Step 2: Add Environment Variables

1. Click on **Settings** tab
2. Click on **Environment Variables** in the sidebar
3. Add the following variables one by one:

---

## 📋 Required Environment Variables

### 1. NextAuth Configuration

**Variable:** `NEXTAUTH_URL`  
**Value:** `https://epsol-index-checker.vercel.app`  
**Environment:** Production

**Variable:** `NEXTAUTH_SECRET`  
**Value:** Generate a random secret (see below)  
**Environment:** Production, Preview, Development

```bash
# Generate a secret (run this locally):
openssl rand -base64 32
```

---

### 2. Database Configuration

**Variable:** `DATABASE_URL`  
**Value:** `postgresql://epsol_user:epsol_password%40786@69.57.161.70:5432/epsol_indexing`  
**Environment:** Production, Preview, Development

⚠️ **Note:** The `%40` is the URL-encoded `@` symbol in the password.

---

### 3. Email Server Configuration (CRITICAL!)

These are **required** for authentication to work:

**Variable:** `EMAIL_SERVER_HOST`  
**Value:** `epsoldev.com`  
**Environment:** Production, Preview, Development

**Variable:** `EMAIL_SERVER_PORT`  
**Value:** `465`  
**Environment:** Production, Preview, Development

**Variable:** `EMAIL_SERVER_USER`  
**Value:** `epsolindexchecker@epsoldev.com`  
**Environment:** Production, Preview, Development

**Variable:** `EMAIL_SERVER_PASSWORD`  
**Value:** `JinnahEnt786`  
**Environment:** Production, Preview, Development

**Variable:** `EMAIL_FROM`  
**Value:** `epsolindexchecker@epsoldev.com`  
**Environment:** Production, Preview, Development

---

### 4. Encryption Key

**Variable:** `EPSOL_KMS_KEY`  
**Value:** `9ImnUDLhggB7FXOKRKeW0OF4mk3zTiw2C/7oMOpm9nA=`  
**Environment:** Production, Preview, Development

---

### 5. Optional: Cron Secret

**Variable:** `CRON_SECRET`  
**Value:** Generate a random secret  
**Environment:** Production

---

## 📸 Step-by-Step Screenshots Guide

### Adding a Variable:

1. In Vercel Dashboard → Project → Settings → Environment Variables
2. Click **"Add New"** button
3. Fill in:
   - **Key:** `EMAIL_SERVER_HOST`
   - **Value:** `epsoldev.com`
   - **Environments:** Check all (Production, Preview, Development)
4. Click **"Save"**
5. Repeat for all variables above

---

## 🔄 Step 3: Redeploy Your Application

After adding all environment variables:

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"..." menu** (three dots)
4. Click **"Redeploy"**
5. Check **"Use existing Build Cache"** (optional)
6. Click **"Redeploy"**

**Or push a new commit to trigger automatic deployment:**

```bash
git add .
git commit -m "Update environment variables"
git push
```

---

## ✅ Verify Configuration

### 1. Check Vercel Logs

After redeployment:

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"View Function Logs"**
4. Look for email sending logs

### 2. Test Sign In

1. Go to: https://epsol-index-checker.vercel.app/auth/signin
2. Enter your email: `khizarjamshaidiqbal@gmail.com`
3. Click **"Sign in with Email"**
4. Check your email inbox for the magic link

### 3. Check for Errors

If you still see errors:

1. Open browser console (F12)
2. Try to sign in
3. Look for detailed error messages
4. Check Vercel Function Logs for server-side errors

---

## 🐛 Troubleshooting

### Error: "Email configuration is incomplete"

**Solution:** Make sure ALL email environment variables are set:
- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`

### Error: "Connection refused" or "ECONNREFUSED"

**Possible causes:**
- Port 5432 (PostgreSQL) might be blocked on Vercel
- Port 465 (SMTP) might be blocked on Vercel
- Firewall blocking connections from Vercel's IP range

**Solution:** Contact Vercel support or use a database proxy like Prisma Accelerate.

### Error: "Authentication failed"

**Solution:** Double-check email credentials:
- Username: `epsolindexchecker@epsoldev.com`
- Password: `JinnahEnt786`
- Test with `npm run test:email` locally first

### Email Not Received

**Check:**
1. ✅ All email variables are set in Vercel
2. ✅ Vercel logs show "Email sent successfully"
3. ✅ Check spam folder
4. ✅ Verify email server is accessible from Vercel

---

## 📊 Complete Environment Variables Checklist

Copy this checklist and verify each variable in Vercel:

```
☐ NEXTAUTH_URL = https://epsol-index-checker.vercel.app
☐ NEXTAUTH_SECRET = (generate with openssl rand -base64 32)
☐ DATABASE_URL = postgresql://epsol_user:epsol_password%40786@69.57.161.70:5432/epsol_indexing
☐ EMAIL_SERVER_HOST = epsoldev.com
☐ EMAIL_SERVER_PORT = 465
☐ EMAIL_SERVER_USER = epsolindexchecker@epsoldev.com
☐ EMAIL_SERVER_PASSWORD = JinnahEnt786
☐ EMAIL_FROM = epsolindexchecker@epsoldev.com
☐ EPSOL_KMS_KEY = 9ImnUDLhggB7FXOKRKeW0OF4mk3zTiw2C/7oMOpm9nA=
☐ CRON_SECRET = (optional, generate random secret)
```

---

## 🚀 Quick Copy-Paste for Vercel

```bash
# NextAuth
NEXTAUTH_URL=https://epsol-index-checker.vercel.app
NEXTAUTH_SECRET=YOUR_GENERATED_SECRET_HERE

# Database
DATABASE_URL=postgresql://epsol_user:epsol_password%40786@69.57.161.70:5432/epsol_indexing

# Email
EMAIL_SERVER_HOST=epsoldev.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=epsolindexchecker@epsoldev.com
EMAIL_SERVER_PASSWORD=JinnahEnt786
EMAIL_FROM=epsolindexchecker@epsoldev.com

# Encryption
EPSOL_KMS_KEY=9ImnUDLhggB7FXOKRKeW0OF4mk3zTiw2C/7oMOpm9nA=
```

---

## 🔒 Security Best Practices

### For Production:

1. **Use Vercel Environment Variables** - Never commit secrets to Git
2. **Different secrets for each environment** - Don't reuse NEXTAUTH_SECRET
3. **Rotate secrets regularly** - Change passwords periodically
4. **Use strong passwords** - 32+ characters, random
5. **Enable 2FA** - On Vercel account
6. **Restrict database access** - Whitelist Vercel IP ranges only

### Vercel IP Ranges:

If your database has IP whitelisting, you may need to whitelist Vercel's IP ranges. See: https://vercel.com/docs/concepts/edge-network/overview

---

## 📱 Alternative: Use Vercel's Built-in Secrets

For sensitive values, use Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Add secrets
vercel secrets add email-server-password JinnahEnt786
vercel secrets add nextauth-secret YOUR_SECRET

# Reference in environment variables
# Key: EMAIL_SERVER_PASSWORD
# Value: @email-server-password
```

---

## ✅ Expected Behavior After Fix

### Development (localhost:3001):
- ✅ Shows magic link in terminal
- ✅ Or sends email if configured

### Production (Vercel):
- ✅ Sends email to user
- ✅ No console errors
- ✅ Shows "Check your email" message
- ✅ Logs show "Email sent successfully"

---

## 📞 Need Help?

If you're still having issues:

1. **Check Vercel Function Logs:**
   - Dashboard → Project → Deployments → Latest → Function Logs
   
2. **Test Email Locally:**
   ```bash
   npm run test:email
   ```

3. **Verify Database Connection:**
   ```bash
   npx prisma db pull
   ```

4. **Contact Support:**
   - Vercel Support: https://vercel.com/support
   - Check GitHub Issues for similar problems

---

## 🎯 Summary

**The issue:** Missing environment variables on Vercel  
**The fix:** Add all email-related environment variables in Vercel dashboard  
**Time needed:** 5-10 minutes  
**Result:** Authentication will work on production! 🎉

Follow the steps above and your authentication will work perfectly on Vercel!
