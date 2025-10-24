import { prisma } from './prisma'
import { checkIndexWithRetry } from './checker'
import { decrypt } from './crypto'
import type { IndexCheckJob } from './queue'

/**
 * Process a single index check job
 */
export async function processIndexCheck(data: IndexCheckJob): Promise<void> {
  const { userId, itemId, campaignId } = data

  try {
    // Get user settings
    const settings = await prisma.setting.findUnique({
      where: { userId },
    })

    if (!settings || !settings.googleKey || !settings.googleCx) {
      // Mark as error - missing credentials
      await prisma.urlItem.update({
        where: { id: itemId },
        data: {
          status: 'ERROR',
          reason: 'Missing Google API credentials in settings',
          checkedAt: new Date(),
        },
      })
      return
    }

    // Decrypt credentials
    let googleKey: string
    let googleCx: string

    try {
      googleKey = decrypt(settings.googleKey)
      googleCx = decrypt(settings.googleCx)
    } catch (error) {
      await prisma.urlItem.update({
        where: { id: itemId },
        data: {
          status: 'ERROR',
          reason: 'Failed to decrypt API credentials',
          checkedAt: new Date(),
        },
      })
      return
    }

    // Get the URL to check
    const item = await prisma.urlItem.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      console.error(`Item ${itemId} not found`)
      return
    }

    // Check the index with retry logic
    const result = await checkIndexWithRetry(item.url, googleKey, googleCx, 3)

    // Update the item with results
    await prisma.urlItem.update({
      where: { id: itemId },
      data: {
        status: result.status,
        title: result.title || null,
        snippet: result.snippet || null,
        reason: result.reason || null,
        checkedAt: new Date(),
      },
    })

    // Update campaign status if needed
    await updateCampaignStatus(campaignId)
  } catch (error) {
    console.error(`Error processing job for item ${itemId}:`, error)

    // Mark item as error
    await prisma.urlItem.update({
      where: { id: itemId },
      data: {
        status: 'ERROR',
        reason: error instanceof Error ? error.message.slice(0, 200) : 'Unknown error',
        checkedAt: new Date(),
      },
    })
  }
}

/**
 * Update campaign status based on items
 */
async function updateCampaignStatus(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      items: {
        select: { status: true },
      },
    },
  })

  if (!campaign) return

  const total = campaign.items.length
  const fetched = campaign.items.filter((item) => item.status !== 'NOT_FETCHED').length

  let status: 'READY' | 'RUNNING' | 'COMPLETE' = 'READY'

  if (fetched === 0) {
    status = 'READY'
  } else if (fetched < total) {
    status = 'RUNNING'
  } else {
    status = 'COMPLETE'
  }

  if (campaign.status !== status) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status },
    })
  }
}
