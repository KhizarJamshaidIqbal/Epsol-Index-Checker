import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiError } from '@/lib/api-helpers'
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from '@/lib/ratelimit'

/**
 * GET /api/export/:campaignId
 * Export campaign items as CSV
 */
export async function GET(request: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    // Check rate limit
    const identifier = getClientIdentifier(request)
    const rateLimit = checkRateLimit(identifier, {
      maxRequests: 10,
      windowMs: 60 * 1000,
    })

    if (!rateLimit.success) {
      return rateLimitExceededResponse(rateLimit)
    }

    // Require authentication
    const user = await requireAuth()

    const { campaignId } = params

    // Verify campaign belongs to user
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
        userId: user.id,
      },
      include: {
        items: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!campaign) {
      return apiError('Campaign not found', 404)
    }

    // Build CSV
    const csvRows: string[] = []

    // Header
    csvRows.push('url,status,title,snippet,reason,checkedAt')

    // Data rows
    for (const item of campaign.items) {
      const row = [
        escapeCsv(item.url),
        item.status,
        escapeCsv(item.title || ''),
        escapeCsv(item.snippet || ''),
        escapeCsv(item.reason || ''),
        item.checkedAt ? item.checkedAt.toISOString() : '',
      ]
      csvRows.push(row.join(','))
    }

    const csv = csvRows.join('\n')

    // Generate filename
    const filename = `${campaign.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.csv`

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting campaign:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    return apiError('Failed to export campaign', 500)
  }
}

/**
 * Escape CSV field (handle quotes and commas)
 */
function escapeCsv(field: string): string {
  if (!field) return ''

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }

  return field
}
