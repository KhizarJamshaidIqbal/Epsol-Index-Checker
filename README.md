# Epsol Index Checker

**Production-ready Google Index Checker at Scale**

Epsol is a modern web application that checks whether URLs are actually indexed on Google using live data from the Google Programmable Search API. It supports bulk URL checking, campaign management, real-time status tracking, and CSV exports.

## Features

- **Bulk URL Checking**: Add thousands of URLs and check their Google index status
- **Campaign Management**: Organize checks into named campaigns
- **Real-time Updates**: Live status updates as URLs are checked
- **Filtering & Search**: Filter by status (Indexed/Not Indexed/Error) and search URLs
- **CSV Export**: Export results for further analysis
- **Secure Credentials**: API keys encrypted at rest
- **Rate Limiting**: Built-in rate limiting to protect your API quota
- **Queue System**: BullMQ with Redis or in-process queue fallback
- **Dark Mode UI**: Modern, responsive interface built with Next.js 14 and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, TypeScript
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **Queue**: BullMQ (Redis) with in-process fallback
- **Auth**: NextAuth.js (Email magic links)
- **Deployment**: Vercel, Railway, or any Node.js platform

## Prerequisites

- Node.js 18+
- npm or yarn
- Redis (optional, for BullMQ queue)
- Google Programmable Search API credentials

## Getting Started

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-a-random-secret>

# Database
DATABASE_URL=file:./dev.db

# Redis (optional)
# REDIS_URL=redis://localhost:6379

# Encryption key (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
EPSOL_KMS_KEY=<base64-encoded-32-byte-key>
```

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push
```

### 4. Configure Google API

1. **Get API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable "Custom Search API"
   - Go to Credentials → Create Credentials → API Key

2. **Create Search Engine**:
   - Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
   - Click "Add" to create a new search engine
   - **Important**: Enable "Search the entire web"
   - Copy the Search Engine ID (CX)

3. **Add credentials in Epsol**:
   - Sign in to Epsol
   - Go to Settings
   - Add your API Key and CX
   - Click Save

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
Epsol-Index-Checker/
├── app/                      # Next.js 14 App Router
│   ├── api/                  # API Routes
│   │   ├── auth/            # NextAuth endpoints
│   │   ├── campaigns/       # Campaign CRUD
│   │   ├── settings/        # User settings
│   │   └── export/          # CSV export
│   ├── campaigns/           # Campaigns list & detail pages
│   ├── new/                 # New campaign page
│   ├── settings/            # Settings page
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/              # React components
├── lib/                     # Utilities & libraries
├── prisma/                  # Database schema
└── types/                   # TypeScript types
```

## API Reference

### Authentication
All API routes require authentication via NextAuth session.

### Endpoints

**Campaigns**
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign details
- `DELETE /api/campaigns/:id` - Delete campaign
- `GET /api/campaigns/:id/items` - Get campaign URLs
- `POST /api/campaigns/:id/recheck` - Recheck URLs

**Settings**
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Save API credentials

**Export**
- `GET /api/export/:campaignId` - Export campaign as CSV

## Deployment

Set these environment variables in production:

```env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<production-secret>
DATABASE_URL=<postgres-connection-string>
REDIS_URL=<redis-connection-string>
EPSOL_KMS_KEY=<encryption-key>
```

For PostgreSQL production:

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
npx prisma migrate deploy
```

## Security Features

- API credentials encrypted at rest using AES-256-GCM
- Server-side only credential storage
- Rate limiting on all endpoints
- CORS protection
- NextAuth secure sessions

## License

MIT

---

**Built with [Claude Code](https://claude.com/claude-code)**