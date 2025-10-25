import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/campaigns/:id/custom-jobs
 * Get all custom jobs for a campaign
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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

    // Fetch all custom jobs
    const jobs = await prisma.customJob.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess(jobs)
  } catch (error) {
    console.error('Error fetching custom jobs:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    return apiError('Failed to fetch custom jobs', 500)
  }
}

/**
 * POST /api/campaigns/:id/custom-jobs
 * Create a new custom job
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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
    const { name, frequency, emailOnComplete } = body

    // Validate input
    if (!name || !frequency) {
      return apiError('Name and frequency are required')
    }

    if (!['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'].includes(frequency)) {
      return apiError('Invalid frequency')
    }

    // Calculate next run time
    const nextRunAt = calculateNextRunTime(frequency)

    // Create custom job
    const job = await prisma.customJob.create({
      data: {
        campaignId,
        userId: user.id,
        name,
        frequency,
        emailOnComplete: emailOnComplete ?? true,
        nextRunAt,
      },
    })

    return apiSuccess(job, 201)
  } catch (error) {
    console.error('Error creating custom job:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    return apiError('Failed to create custom job', 500)
  }
}

/**
 * Calculate next run time based on frequency
 */
function calculateNextRunTime(frequency: string): Date {
  const now = new Date()

  switch (frequency) {
    case 'HOURLY':
      return new Date(now.getTime() + 60 * 60 * 1000) // +1 hour
    case 'DAILY':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000) // +1 day
    case 'WEEKLY':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // +7 days
    case 'MONTHLY':
      const nextMonth = new Date(now)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      return nextMonth
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000) // Default to 1 day
  }
}
