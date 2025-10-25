import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiSuccess, apiError } from '@/lib/api-helpers'
import { checkRateLimit, getClientIdentifier, rateLimitExceededResponse } from '@/lib/ratelimit'
import { encrypt, decrypt } from '@/lib/crypto'

// Force dynamic rendering - this route uses authentication
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/settings
 * Get user settings (without exposing encrypted values)
 */
export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const identifier = getClientIdentifier(request)
    const rateLimit = checkRateLimit(identifier)

    if (!rateLimit.success) {
      return rateLimitExceededResponse(rateLimit)
    }

    // Require authentication
    const user = await requireAuth()

    // Get settings
    const settings = await prisma.setting.findUnique({
      where: { userId: user.id },
    })

    return apiSuccess({
      hasGoogleKey: !!settings?.googleKey,
      hasGoogleCx: !!settings?.googleCx,
      updatedAt: settings?.updatedAt || null,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    return apiError('Failed to fetch settings', 500)
  }
}

/**
 * POST /api/settings
 * Save user settings (encrypts API credentials)
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { googleKey, googleCx } = body

    // Validate input
    if (typeof googleKey !== 'string' && googleKey !== null && googleKey !== undefined) {
      return apiError('Invalid googleKey')
    }

    if (typeof googleCx !== 'string' && googleCx !== null && googleCx !== undefined) {
      return apiError('Invalid googleCx')
    }

    // Prepare encrypted data
    const data: any = {}

    if (googleKey !== undefined) {
      data.googleKey = googleKey ? encrypt(googleKey.trim()) : null
    }

    if (googleCx !== undefined) {
      data.googleCx = googleCx ? encrypt(googleCx.trim()) : null
    }

    // Upsert settings
    const settings = await prisma.setting.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...data,
      },
      update: data,
    })

    return apiSuccess({
      saved: true,
      hasGoogleKey: !!settings.googleKey,
      hasGoogleCx: !!settings.googleCx,
      updatedAt: settings.updatedAt,
    })
  } catch (error) {
    console.error('Error saving settings:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    if (error instanceof Error && error.message.includes('encrypt')) {
      return apiError('Failed to encrypt credentials. Check server configuration.', 500)
    }

    return apiError('Failed to save settings', 500)
  }
}
