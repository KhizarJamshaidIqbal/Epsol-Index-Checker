import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiSuccess, apiError } from '@/lib/api-helpers'
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from '@/lib/ratelimit'

/**
 * DELETE /api/campaigns/:id/items/delete
 * Delete one or more URL items from a campaign
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

    // Parse request body
    const body = await request.json()
    const { itemIds } = body

    // Validate input
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return apiError('Item IDs array is required')
    }

    if (itemIds.length > 1000) {
      return apiError('Maximum 1000 items can be deleted at once')
    }

    // Delete the items (only those belonging to this campaign)
    const result = await prisma.urlItem.deleteMany({
      where: {
        id: {
          in: itemIds,
        },
        campaignId,
      },
    })

    return apiSuccess({
      deleted: result.count,
      message: `Successfully deleted ${result.count} URL${result.count !== 1 ? 's' : ''}`,
    })
  } catch (error) {
    console.error('Error deleting URL items:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    return apiError('Failed to delete URL items', 500)
  }
}
