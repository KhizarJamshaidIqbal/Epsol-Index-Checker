'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function NewCampaignPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [urls, setUrls] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const urlCount = urls
    .split('\n')
    .filter((line) => line.trim().length > 0).length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const urlList = urls
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, urls: urlList }),
      })

      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to create campaign')
      }

      router.push(`/campaigns/${data.data.campaign.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New Campaign</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Give your campaign a name and add URLs to check</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Website Index Check"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="urls">URLs (one per line)</Label>
              <Textarea
                id="urls"
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://example.com&#10;https://example.com/page1&#10;https://example.com/page2"
                className="min-h-[300px] font-mono text-sm"
                required
              />
              <p className="text-sm text-muted-foreground">
                {urlCount} URL{urlCount !== 1 ? 's' : ''} entered
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading || !name || urlCount === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Campaign
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
