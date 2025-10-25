import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiSuccess, apiError } from '@/lib/api-helpers'

// Force dynamic rendering - this route uses authentication
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/database
 * Get database information including tables and row counts
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()

    // Get database name from connection string
    const dbUrl = process.env.DATABASE_URL || ''
    let databaseName = 'Unknown'
    
    if (dbUrl.includes('postgresql://')) {
      const match = dbUrl.match(/\/([^/?]+)(\?|$)/)
      databaseName = match ? match[1] : 'PostgreSQL Database'
    } else if (dbUrl.includes('file:')) {
      const match = dbUrl.match(/file:(.+)/)
      databaseName = match ? match[1] : 'SQLite Database'
    }

    // Get counts for all tables
    const [
      userCount,
      accountCount,
      sessionCount,
      verificationTokenCount,
      settingCount,
      campaignCount,
      urlItemCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
      prisma.session.count(),
      prisma.verificationToken.count(),
      prisma.setting.count(),
      prisma.campaign.count(),
      prisma.urlItem.count(),
    ])

    const tables = [
      { name: 'User', count: userCount },
      { name: 'Account', count: accountCount },
      { name: 'Session', count: sessionCount },
      { name: 'VerificationToken', count: verificationTokenCount },
      { name: 'Setting', count: settingCount },
      { name: 'Campaign', count: campaignCount },
      { name: 'UrlItem', count: urlItemCount },
    ]

    return apiSuccess({
      databaseName,
      tables,
      totalTables: tables.length,
      totalRows: tables.reduce((sum, t) => sum + t.count, 0),
    })
  } catch (error) {
    console.error('Error fetching database info:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    return apiError('Failed to fetch database information', 500)
  }
}
