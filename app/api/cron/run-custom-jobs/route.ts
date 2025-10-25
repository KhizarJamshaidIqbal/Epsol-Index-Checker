import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-helpers'
import { enqueueIndexCheckBulk } from '@/lib/queue'
import { sendCustomJobEmail } from '@/lib/email-notifications'

/**
 * POST /api/cron/run-custom-jobs
 * Check and run due custom jobs
 * This should be called by a cron job every hour
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add secret token for cron job security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return apiError('Unauthorized', 401)
    }

    const now = new Date()

    // Find all active jobs that are due to run
    const dueJobs = await prisma.customJob.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          lte: now,
        },
      },
      include: {
        campaign: {
          include: {
            items: {
              where: {
                status: {
                  in: ['NOT_FETCHED', 'NOT_INDEXED', 'ERROR'],
                },
              },
              select: {
                id: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    })

    const results = []

    for (const job of dueJobs) {
      try {
        const campaign = job.campaign
        
        // Skip if no items to check
        if (campaign.items.length === 0) {
          results.push({
            jobId: job.id,
            jobName: job.name,
            status: 'skipped',
            reason: 'No items to recheck',
          })
          continue
        }

        // Update campaign status
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'RUNNING' },
        })

        // Enqueue recheck jobs
        const recheckJobs = campaign.items.map((item) => ({
          userId: campaign.user.id,
          itemId: item.id,
          campaignId: campaign.id,
        }))

        await enqueueIndexCheckBulk(recheckJobs)

        // Calculate next run time
        const nextRunAt = calculateNextRunTime(job.frequency, now)

        // Update job
        await prisma.customJob.update({
          where: { id: job.id },
          data: {
            lastRunAt: now,
            nextRunAt,
          },
        })

        // Send email notification if enabled
        if (job.emailOnComplete && campaign.user.email) {
          await sendCustomJobEmail({
            to: campaign.user.email,
            jobName: job.name,
            campaignName: campaign.name,
            campaignId: campaign.id,
            urlsChecked: recheckJobs.length,
            frequency: job.frequency,
          })
        }

        results.push({
          jobId: job.id,
          jobName: job.name,
          campaignName: campaign.name,
          status: 'success',
          urlsQueued: recheckJobs.length,
          nextRunAt: nextRunAt.toISOString(),
        })
      } catch (error) {
        console.error(`Error running job ${job.id}:`, error)
        results.push({
          jobId: job.id,
          jobName: job.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return apiSuccess({
      message: `Processed ${dueJobs.length} custom jobs`,
      results,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Error running custom jobs:', error)
    return apiError('Failed to run custom jobs', 500)
  }
}

/**
 * Calculate next run time based on frequency
 */
function calculateNextRunTime(frequency: string, from: Date = new Date()): Date {
  const next = new Date(from)

  switch (frequency) {
    case 'HOURLY':
      next.setHours(next.getHours() + 1)
      break
    case 'DAILY':
      next.setDate(next.getDate() + 1)
      break
    case 'WEEKLY':
      next.setDate(next.getDate() + 7)
      break
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1)
      break
    default:
      next.setDate(next.getDate() + 1) // Default to 1 day
  }

  return next
}
