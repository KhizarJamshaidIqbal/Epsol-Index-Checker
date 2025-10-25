import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/database/[tableName]
 * Get all rows from a specific table
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tableName: string } }
) {
  try {
    // Require authentication
    const user = await requireAuth()

    const { tableName } = params

    // Map table names to Prisma models
    const tableMap: Record<string, any> = {
      User: prisma.user,
      Account: prisma.account,
      Session: prisma.session,
      VerificationToken: prisma.verificationToken,
      Setting: prisma.setting,
      Campaign: prisma.campaign,
      UrlItem: prisma.urlItem,
    }

    // Validate table name
    if (!tableMap[tableName]) {
      return apiError('Invalid table name', 400)
    }

    // Fetch all rows from the table
    const rows = await tableMap[tableName].findMany({
      take: 100, // Limit to 100 rows for performance
    })

    // Get column names from the first row
    const columns = rows.length > 0 ? Object.keys(rows[0]) : []

    return apiSuccess({
      tableName,
      columns,
      rows,
      count: rows.length,
    })
  } catch (error) {
    console.error('Error fetching table data:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    return apiError('Failed to fetch table data', 500)
  }
}
