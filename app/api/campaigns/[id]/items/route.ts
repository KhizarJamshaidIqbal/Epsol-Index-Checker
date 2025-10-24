import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiSuccess, apiError } from '@/lib/api-helpers'
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from '@/lib/ratelimit'
import { UrlStatus } from '@prisma/client'

/**
 * GET /api/campaigns/:id/items
 * Get campaign items with filtering and pagination
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check rate limit
    const identifier = getClientIdentifier(request)
    const rateLimit = checkRateLimit(identifier)

    if (!rateLimit.success) {
      return rateLimitExceededResponse(rateLimit)
    }

    // Require authentication
    const user = await requireAuth()

    const { id: campaignId } = params

    // Verify campaign belongs to user
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
        userId: user.id,
      },
    })

    if (!campaign) {
      return apiError('Campaign not found', 404)
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50', 10), 500)
    const status = searchParams.get('status') as UrlStatus | null
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: any = {
      campaignId,
    }

    if (status && ['NOT_FETCHED', 'INDEXED', 'NOT_INDEXED', 'ERROR'].includes(status)) {
      where.status = status
    }

    if (search) {
      where.url = {
        contains: search,
      }
    }

    // Get items
    const [items, total] = await Promise.all([
      prisma.urlItem.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.urlItem.count({ where }),
    ])

    return apiSuccess({
      items: items.map((item, index) => ({
        id: item.id,
        number: (page - 1) * pageSize + index + 1,
        url: item.url,
        status: item.status,
        title: item.title,
        snippet: item.snippet,
        reason: item.reason,
        checkedAt: item.checkedAt,
        createdAt: item.createdAt,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Error fetching items:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    return apiError('Failed to fetch items', 500)
  }
}
