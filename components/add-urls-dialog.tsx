'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Plus } from 'lucide-react'

interface AddUrlsDialogProps {
  campaignId: string
  onSuccess: () => void
}

export function AddUrlsDialog({ campaignId, onSuccess }: AddUrlsDialogProps) {
  const [open, setOpen] = useState(false)
  const [urls, setUrls] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const urlCount = urls
    .split('\n')
    .filter((line) => line.trim().length > 0).length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const urlList = urls
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      const res = await fetch(`/api/campaigns/${campaignId}/add-urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList }),
      })

      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to add URLs')
      }

      setResult(data.data)
      setUrls('')
      
      // Show success message
      setTimeout(() => {
        setOpen(false)
        onSuccess()
        setResult(null)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add URLs')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setOpen(false)
      setUrls('')
      setError(null)
      setResult(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Add URLs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add URLs to Campaign</DialogTitle>
          <DialogDescription>
            Add new URLs to check in this campaign. One URL per line.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="urls">URLs (one per line)</Label>
              <Textarea
                id="urls"
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
                className="min-h-[200px] font-mono text-sm"
                disabled={loading}
                required
              />
              <p className="text-sm text-muted-foreground">
                {urlCount} URL{urlCount !== 1 ? 's' : ''} entered
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {result && (
              <div className="rounded-md bg-green-500/10 p-3 text-sm space-y-1">
                <p className="font-medium text-green-600">✅ URLs added successfully!</p>
                <div className="text-muted-foreground space-y-0.5">
                  <p>• Added: {result.stats.added} new URL(s)</p>
                  {result.stats.alreadyInCampaign > 0 && (
                    <p>• Skipped: {result.stats.alreadyInCampaign} (already in campaign)</p>
                  )}
                  {result.stats.duplicatesInSubmission > 0 && (
                    <p>• Duplicates: {result.stats.duplicatesInSubmission}</p>
                  )}
                  {result.stats.errors > 0 && (
                    <p>• Errors: {result.stats.errors} invalid URL(s)</p>
                  )}
                </div>
                <p className="text-xs mt-2">Closing in 3 seconds...</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || urlCount === 0 || !!result}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add URLs
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
