'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Calendar, Loader2, Plus, Trash2, Clock, Mail, Power, PowerOff } from 'lucide-react'

interface CustomJob {
  id: string
  name: string
  frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  isActive: boolean
  emailOnComplete: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  createdAt: string
}

interface CustomJobsDialogProps {
  campaignId: string
  campaignName: string
}

const FREQUENCY_LABELS = {
  HOURLY: 'Every Hour',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
}

const FREQUENCY_ICONS = {
  HOURLY: '⏰',
  DAILY: '📅',
  WEEKLY: '📆',
  MONTHLY: '🗓️',
}

export function CustomJobsDialog({ campaignId, campaignName }: CustomJobsDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [jobs, setJobs] = useState<CustomJob[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Form state
  const [jobName, setJobName] = useState('')
  const [frequency, setFrequency] = useState<'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY')
  const [emailOnComplete, setEmailOnComplete] = useState(true)

  useEffect(() => {
    if (open) {
      fetchJobs()
    }
  }, [open])

  async function fetchJobs() {
    setLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/custom-jobs`)
      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch custom jobs')
      }

      setJobs(data.data)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load custom jobs',
      })
    } finally {
      setLoading(false)
    }
  }

  async function createJob() {
    if (!jobName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a job name',
      })
      return
    }

    setCreating(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/custom-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: jobName,
          frequency,
          emailOnComplete,
        }),
      })

      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to create custom job')
      }

      toast({
        title: 'Custom Job Created',
        description: `Job "${jobName}" has been scheduled successfully`,
      })

      setJobName('')
      setFrequency('DAILY')
      setEmailOnComplete(true)
      setShowCreateForm(false)
      fetchJobs()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create custom job',
      })
    } finally {
      setCreating(false)
    }
  }

  async function toggleJobStatus(jobId: string, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/custom-jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to update job status')
      }

      toast({
        title: currentStatus ? 'Job Paused' : 'Job Activated',
        description: currentStatus ? 'Job will not run until activated' : 'Job is now active',
      })

      fetchJobs()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update job status',
      })
    }
  }

  async function deleteJob(jobId: string, jobName: string) {
    if (!confirm(`Are you sure you want to delete the job "${jobName}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/custom-jobs/${jobId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to delete job')
      }

      toast({
        title: 'Job Deleted',
        description: `Job "${jobName}" has been deleted successfully`,
      })

      fetchJobs()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete job',
      })
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          Custom Jobs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom Scheduled Jobs</DialogTitle>
          <DialogDescription>
            Automatically recheck URLs and receive results via email for <span className="font-medium">{campaignName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Create Job Button */}
          {!showCreateForm && (
            <Button onClick={() => setShowCreateForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New Custom Job
            </Button>
          )}

          {/* Create Job Form */}
          {showCreateForm && (
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Create New Job</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false)
                    setJobName('')
                  }}
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Job Name</label>
                  <input
                    type="text"
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    placeholder="e.g., Daily Index Check"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Frequency</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'] as const).map((freq) => (
                      <button
                        key={freq}
                        onClick={() => setFrequency(freq)}
                        className={`rounded-lg border p-3 text-center transition-all ${
                          frequency === freq
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{FREQUENCY_ICONS[freq]}</div>
                        <div className="text-xs font-medium">{FREQUENCY_LABELS[freq]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="emailOnComplete"
                    checked={emailOnComplete}
                    onChange={(e) => setEmailOnComplete(e.target.checked)}
                    className="rounded border-input"
                  />
                  <label htmlFor="emailOnComplete" className="text-sm font-medium cursor-pointer">
                    Send email notification when job completes
                  </label>
                </div>

                <Button onClick={createJob} disabled={creating} className="w-full">
                  {creating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Job
                </Button>
              </div>
            </div>
          )}

          {/* Jobs List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Custom Jobs Yet</p>
              <p className="text-sm">Create your first automated recheck job to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Active Jobs ({jobs.length})</h3>
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{FREQUENCY_ICONS[job.frequency]}</div>
                        <div>
                          <h4 className="font-semibold">{job.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Runs {FREQUENCY_LABELS[job.frequency].toLowerCase()}
                          </p>
                        </div>
                        <div className="ml-auto">
                          {job.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                              <Power className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-400">
                              <PowerOff className="h-3 w-3" />
                              Paused
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Last run: {formatDate(job.lastRunAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Next run: {formatDate(job.nextRunAt)}</span>
                        </div>
                      </div>

                      {job.emailOnComplete && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span>Email notifications enabled</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleJobStatus(job.id, job.isActive)}
                      >
                        {job.isActive ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteJob(job.id, job.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
