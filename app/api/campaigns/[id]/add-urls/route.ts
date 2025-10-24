import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiSuccess, apiError } from '@/lib/api-helpers'
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from '@/lib/ratelimit'
import { parseUrlList, deduplicateUrls } from '@/lib/normalizeUrl'

/**
 * POST /api/campaigns/:id/add-urls
 * Add new URLs to an existing campaign
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id: campaignId } = params

    // Verify campaign belongs to user
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
        userId: user.id,
      },
      include: {
        items: {
          select: { url: true },
        },
      },
    })

    if (!campaign) {
      return apiError('Campaign not found', 404)
    }

    // Parse request body
    const body = await request.json()
    const { urls } = body

    // Validate input
    if (!urls || !Array.isArray(urls)) {
      return apiError('URLs array is required')
    }

    if (urls.length === 0) {
      return apiError('At least one URL is required')
    }

    if (urls.length > 10000) {
      return apiError('Maximum 10,000 URLs can be added at once')
    }

    // Check total campaign size
    const currentCount = campaign.items.length
    if (currentCount + urls.length > 50000) {
      return apiError(`Campaign would exceed maximum size of 50,000 URLs (current: ${currentCount})`)
    }

    // Parse and validate URLs
    const urlText = urls.join('\n')
    const { valid, errors } = parseUrlList(urlText)

    if (valid.length === 0) {
      return apiError('No valid URLs provided')
    }

    // Get existing URLs in campaign (for duplicate detection)
    const existingUrls = new Set(campaign.items.map((item) => item.url))

    // Deduplicate URLs
    const { unique, duplicates } = deduplicateUrls(valid)

    // Filter out URLs that already exist in the campaign
    const newUrls = unique.filter((url) => !existingUrls.has(url))
    const alreadyInCampaign = unique.length - newUrls.length

    if (newUrls.length === 0) {
      return apiError('All provided URLs already exist in this campaign')
    }

    // Add new URL items to campaign
    await prisma.urlItem.createMany({
      data: newUrls.map((url) => ({
        campaignId,
        url,
        status: 'NOT_FETCHED',
      })),
    })

    // Get updated campaign stats
    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        _count: {
          select: { items: true },
        },
      },
    })

    return apiSuccess(
      {
        campaign: {
          id: updatedCampaign!.id,
          name: updatedCampaign!.name,
          totalUrls: updatedCampaign!._count.items,
        },
        stats: {
          submitted: urls.length,
          valid: valid.length,
          unique: unique.length,
          duplicatesInSubmission: duplicates,
          alreadyInCampaign,
          added: newUrls.length,
          errors: errors.length,
        },
        errors: errors.slice(0, 10), // Return first 10 errors
      },
      201
    )
  } catch (error) {
    console.error('Error adding URLs to campaign:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    return apiError('Failed to add URLs to campaign', 500)
  }
}
