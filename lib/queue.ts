import { Queue, Worker, Job } from 'bullmq'
import Redis from 'ioredis'

export interface IndexCheckJob {
  userId: string
  itemId: string
  campaignId: string
}

// Queue interface for abstraction
interface QueueInterface {
  add(name: string, data: IndexCheckJob): Promise<void>
  addBulk(jobs: Array<{ name: string; data: IndexCheckJob }>): Promise<void>
  close(): Promise<void>
}

// BullMQ implementation
class BullMQQueue implements QueueInterface {
  private queue: Queue

  constructor(redisUrl: string) {
    const connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    })

    this.queue = new Queue('index-check', {
      connection,
    })
  }

  async add(name: string, data: IndexCheckJob): Promise<void> {
    await this.queue.add(name, data)
  }

  async addBulk(jobs: Array<{ name: string; data: IndexCheckJob }>): Promise<void> {
    await this.queue.addBulk(jobs)
  }

  async close(): Promise<void> {
    await this.queue.close()
  }

  getQueue(): Queue {
    return this.queue
  }
}

// In-process queue implementation (fallback)
class InProcessQueue implements QueueInterface {
  private jobs: Array<{ name: string; data: IndexCheckJob }> = []
  private processing = false
  private concurrency = 3

  async add(name: string, data: IndexCheckJob): Promise<void> {
    this.jobs.push({ name, data })
    this.processJobs() // Fire and forget
  }

  async addBulk(jobs: Array<{ name: string; data: IndexCheckJob }>): Promise<void> {
    this.jobs.push(...jobs)
    this.processJobs() // Fire and forget
  }

  async close(): Promise<void> {
    // Wait for all jobs to complete
    while (this.jobs.length > 0 || this.processing) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  private async processJobs(): Promise<void> {
    if (this.processing) return
    this.processing = true

    try {
      while (this.jobs.length > 0) {
        const batch = this.jobs.splice(0, this.concurrency)
        await Promise.all(batch.map((job) => this.processJob(job)))
      }
    } finally {
      this.processing = false
    }
  }

  private async processJob(job: { name: string; data: IndexCheckJob }): Promise<void> {
    try {
      // Import worker function and execute
      const { processIndexCheck } = await import('./worker')
      await processIndexCheck(job.data)
    } catch (error) {
      console.error('In-process job error:', error)
    }
  }
}

// Singleton queue instance
let queueInstance: QueueInterface | null = null

/**
 * Get or create the queue instance
 */
export function getQueue(): QueueInterface {
  if (!queueInstance) {
    const redisUrl = process.env.REDIS_URL

    if (redisUrl) {
      try {
        queueInstance = new BullMQQueue(redisUrl)
        console.log('✓ Using BullMQ with Redis')
      } catch (error) {
        console.warn('Failed to connect to Redis, falling back to in-process queue:', error)
        queueInstance = new InProcessQueue()
      }
    } else {
      console.log('✓ Using in-process queue (REDIS_URL not set)')
      queueInstance = new InProcessQueue()
    }
  }

  return queueInstance
}

/**
 * Create a BullMQ worker (only if Redis is available)
 */
export function createWorker(
  processor: (job: Job<IndexCheckJob>) => Promise<void>
): Worker | null {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    console.log('Worker not created: in-process queue handles jobs internally')
    return null
  }

  try {
    const connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    })

    const worker = new Worker('index-check', processor, {
      connection,
      concurrency: 3,
    })

    worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed`)
    })

    worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err)
    })

    console.log('✓ BullMQ worker started')
    return worker
  } catch (error) {
    console.error('Failed to create worker:', error)
    return null
  }
}

/**
 * Add a single index check job
 */
export async function enqueueIndexCheck(data: IndexCheckJob): Promise<void> {
  const queue = getQueue()
  await queue.add('index-check', data)
}

/**
 * Add multiple index check jobs in bulk
 */
export async function enqueueIndexCheckBulk(items: IndexCheckJob[]): Promise<void> {
  const queue = getQueue()
  const jobs = items.map((data) => ({
    name: 'index-check',
    data,
  }))
  await queue.addBulk(jobs)
}
