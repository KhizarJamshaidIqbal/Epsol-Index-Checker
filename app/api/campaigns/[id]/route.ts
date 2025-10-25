import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiSuccess, apiError } from '@/lib/api-helpers'
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from '@/lib/ratelimit'

// Force dynamic rendering - this route uses authentication
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/campaigns/:id
 * Get campaign details with stats
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

    const { id } = params

    // Get campaign with items
    const campaign = await prisma.campaign.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        _count: {
          select: { items: true },
        },
        items: {
          select: { status: true },
        },
      },
    })

    if (!campaign) {
      return apiError('Campaign not found', 404)
    }

    // Calculate stats
    const totalItems = campaign._count.items
    const indexed = campaign.items.filter((i) => i.status === 'INDEXED').length
    const notIndexed = campaign.items.filter((i) => i.status === 'NOT_INDEXED').length
    const errors = campaign.items.filter((i) => i.status === 'ERROR').length
    const notFetched = campaign.items.filter((i) => i.status === 'NOT_FETCHED').length
    const fetched = totalItems - notFetched
    const progress = totalItems > 0 ? Math.round((fetched / totalItems) * 100) : 0

    return apiSuccess({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      createdAt: campaign.createdAt,
      stats: {
        total: totalItems,
        indexed,
        notIndexed,
        errors,
        notFetched,
        fetched,
        progress,
      },
    })
  } catch (error) {
    console.error('Error fetching campaign:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    return apiError('Failed to fetch campaign', 500)
  }
}

/**
 * DELETE /api/campaigns/:id
 * Delete a campaign
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check rate limit
    const identifier = getClientIdentifier(request)
    const rateLimit = checkRateLimit(identifier)

    if (!rateLimit.success) {
      return rateLimitExceededResponse(rateLimit)
    }

    // Require authentication
    const user = await requireAuth()

    const { id } = params

    // Check campaign exists and belongs to user
    const campaign = await prisma.campaign.findUnique({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!campaign) {
      return apiError('Campaign not found', 404)
    }

    // Delete campaign (cascade will delete items)
    await prisma.campaign.delete({
      where: { id },
    })

    return apiSuccess({ deleted: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    return apiError('Failed to delete campaign', 500)
  }
}
