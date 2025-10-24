import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiSuccess, apiError } from '@/lib/api-helpers'
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from '@/lib/ratelimit'
import { enqueueIndexCheckBulk } from '@/lib/queue'

/**
 * POST /api/campaigns/:id/recheck
 * Recheck URLs in a campaign
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check rate limit (more restrictive for recheck)
    const identifier = getClientIdentifier(request)
    const rateLimit = checkRateLimit(identifier, {
      maxRequests: 5,
      windowMs: 60 * 1000,
    })

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
    const body = await request.json().catch(() => ({}))
    const { itemIds } = body

    let itemsToCheck

    if (itemIds && Array.isArray(itemIds)) {
      // Recheck specific items
      itemsToCheck = await prisma.urlItem.findMany({
        where: {
          id: { in: itemIds },
          campaignId,
        },
        select: {
          id: true,
        },
      })

      if (itemsToCheck.length === 0) {
        return apiError('No valid items found to recheck')
      }
    } else {
      // Recheck all items that are NOT_FETCHED, NOT_INDEXED, or ERROR
      itemsToCheck = await prisma.urlItem.findMany({
        where: {
          campaignId,
          status: {
            in: ['NOT_FETCHED', 'NOT_INDEXED', 'ERROR'],
          },
        },
        select: {
          id: true,
        },
      })

      if (itemsToCheck.length === 0) {
        return apiError('No items to recheck (all items already indexed or fetching)')
      }
    }

    // Update campaign status
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'RUNNING' },
    })

    // Enqueue jobs
    const jobs = itemsToCheck.map((item) => ({
      userId: user.id,
      itemId: item.id,
      campaignId,
    }))

    await enqueueIndexCheckBulk(jobs)

    return apiSuccess(
      {
        queued: jobs.length,
        message: `Queued ${jobs.length} URLs for checking`,
      },
      202
    )
  } catch (error) {
    console.error('Error rechecking campaign:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    return apiError('Failed to recheck campaign', 500)
  }
}
