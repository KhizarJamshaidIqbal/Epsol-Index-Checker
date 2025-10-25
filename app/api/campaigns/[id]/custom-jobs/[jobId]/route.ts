import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * PATCH /api/campaigns/:id/custom-jobs/:jobId
 * Update a custom job (toggle active status)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; jobId: string } }
) {
  try {
    const user = await requireAuth()
    const { id: campaignId, jobId } = params

    // Parse request body
    const body = await request.json()
    const { isActive } = body

    // Verify job belongs to user
    const job = await prisma.customJob.findFirst({
      where: {
        id: jobId,
        campaignId,
        userId: user.id,
      },
    })

    if (!job) {
      return apiError('Custom job not found', 404)
    }

    // Update job
    const updatedJob = await prisma.customJob.update({
      where: { id: jobId },
      data: { isActive },
    })

    return apiSuccess(updatedJob)
  } catch (error) {
    console.error('Error updating custom job:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    return apiError('Failed to update custom job', 500)
  }
}

/**
 * DELETE /api/campaigns/:id/custom-jobs/:jobId
 * Delete a custom job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; jobId: string } }
) {
  try {
    const user = await requireAuth()
    const { id: campaignId, jobId } = params

    // Verify job belongs to user
    const job = await prisma.customJob.findFirst({
      where: {
        id: jobId,
        campaignId,
        userId: user.id,
      },
    })

    if (!job) {
      return apiError('Custom job not found', 404)
    }

    // Delete job
    await prisma.customJob.delete({
      where: { id: jobId },
    })

    return apiSuccess({ message: 'Custom job deleted successfully' })
  } catch (error) {
    console.error('Error deleting custom job:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return apiError('Unauthorized', 401)
    }

    return apiError('Failed to delete custom job', 500)
  }
}
