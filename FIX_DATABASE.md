# Fix Database Connection Error

## Problem
```
Can't reach database server at `69.57.161.70:5432`
```

The remote PostgreSQL server is not reachable (port blocked or server down).

## Solution: Switch to SQLite for Local Development

### Step 1: Update your `.env` file

Open `.env` and change the DATABASE_URL:

**FROM:**
```env
DATABASE_URL=postgresql://epsol_user:epsol_password%40786@69.57.161.70:5432/epsol_indexing
```

**TO:**
```env
DATABASE_URL=file:./dev.db
```

### Step 2: Update Prisma Schema

Open `prisma/schema.prisma` and change the datasource:

**FROM:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**TO:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 3: Push Schema to SQLite

Run this command:
```bash
npx prisma db push
```

### Step 4: Restart Dev Server

Stop the current server (Ctrl+C in terminal) and restart:
```bash
npm run dev
```

## Done! ✅

Your app will now use a local SQLite database file (`dev.db`) instead of the remote PostgreSQL server.

## Alternative: Fix PostgreSQL Connection

If you need to use PostgreSQL:

1. **Check if server is running:**
   ```powershell
   Test-NetConnection -ComputerName 69.57.161.70 -Port 5432
   ```

2. **Check firewall** - Port 5432 might be blocked
3. **Use SSH tunnel** if behind firewall
4. **Contact server admin** to verify access

## Switching Back to PostgreSQL Later

When you're ready to deploy or use PostgreSQL again:

1. Change DATABASE_URL back to PostgreSQL connection string
2. Change `provider = "postgresql"` in schema.prisma
3. Run `npx prisma db push`
