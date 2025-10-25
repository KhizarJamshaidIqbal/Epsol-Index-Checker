import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiSuccess, apiError } from '@/lib/api-helpers'
import { parseUrlList, deduplicateUrls } from '@/lib/normalizeUrl'
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from '@/lib/ratelimit'

// Force dynamic rendering - this route uses authentication
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/campaigns
 * Create a new campaign with URLs
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const identifier = getClientIdentifier(request)
    const rateLimit = checkRateLimit(identifier, {
      maxRequests: 10,
      windowMs: 60 * 1000,
      burst: 5,
    })

    if (!rateLimit.success) {
      return rateLimitExceededResponse(rateLimit)
    }

    // Require authentication
    const user = await requireAuth()

    // Parse request body
    const body = await request.json()
    const { name, urls } = body

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return apiError('Campaign name is required')
    }

    if (!urls || !Array.isArray(urls)) {
      return apiError('URLs array is required')
    }

    if (urls.length === 0) {
      return apiError('At least one URL is required')
    }

    if (urls.length > 10000) {
      return apiError('Maximum 10,000 URLs per campaign')
    }

    // Parse and validate URLs
    const urlText = urls.join('\n')
    const { valid, errors } = parseUrlList(urlText)

    if (valid.length === 0) {
      return apiError('No valid URLs provided')
    }

    // Deduplicate URLs
    const { unique, duplicates } = deduplicateUrls(valid)

    // Create campaign and URL items
    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        userId: user.id,
        status: 'READY',
        items: {
          create: unique.map((url) => ({
            url,
            status: 'NOT_FETCHED',
          })),
        },
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    })

    return apiSuccess(
      {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          createdAt: campaign.createdAt,
          totalUrls: campaign._count.items,
        },
        stats: {
          total: urls.length,
          valid: valid.length,
          unique: unique.length,
          duplicates,
          errors: errors.length,
        },
        errors: errors.slice(0, 10), // Return first 10 errors
      },
      201
    )
  } catch (error) {
    console.error('Error creating campaign:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    return apiError('Failed to create campaign', 500)
  }
}

/**
 * GET /api/campaigns
 * List all campaigns for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const identifier = getClientIdentifier(request)
    const rateLimit = checkRateLimit(identifier, {
      maxRequests: 100,
      windowMs: 60 * 1000,
    })

    if (!rateLimit.success) {
      return rateLimitExceededResponse(rateLimit)
    }

    // Require authentication
    const user = await requireAuth()

    // Get pagination params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20', 10), 100)
    const search = searchParams.get('search') || ''

    // Build query
    const where = {
      userId: user.id,
      ...(search && {
        name: {
          contains: search,
        },
      }),
    }

    // Get campaigns with counts
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          _count: {
            select: { items: true },
          },
          items: {
            select: { status: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.campaign.count({ where }),
    ])

    // Format response
    const formatted = campaigns.map((campaign) => {
      const totalItems = campaign._count.items
      const notFetched = campaign.items.filter((i) => i.status === 'NOT_FETCHED').length
      const indexed = campaign.items.filter((i) => i.status === 'INDEXED').length
      const notIndexed = campaign.items.filter((i) => i.status === 'NOT_INDEXED').length
      const errors = campaign.items.filter((i) => i.status === 'ERROR').length
      const fetched = totalItems - notFetched
      const progress = totalItems > 0 ? Math.round((fetched / totalItems) * 100) : 0

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        createdAt: campaign.createdAt,
        totalUrls: totalItems,
        progress,
        stats: {
          indexed,
          notIndexed,
          errors,
          notFetched,
        },
      }
    })

    return apiSuccess({
      campaigns: formatted,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Error listing campaigns:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    return apiError('Failed to fetch campaigns', 500)
  }
}
