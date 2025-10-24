'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Plus } from 'lucide-react'
import { CampaignsTable } from '@/components/campaigns-list/campaigns-table'

interface Campaign {
  id: string
  name: string
  status: 'READY' | 'RUNNING' | 'COMPLETE'
  createdAt: string
  totalUrls: number
  progress: number
  stats: {
    indexed: number
    notIndexed: number
    errors: number
    notFetched: number
  }
}

export default function CampaignsPage() {
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  async function fetchCampaigns() {
    try {
      const res = await fetch('/api/campaigns')
      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch campaigns')
      }

      setCampaigns(data.data.campaigns)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to delete campaign')
      }

      setCampaigns((prev) => prev.filter((c) => c.id !== id))
      toast({
        title: 'Campaign Deleted',
        description: 'Campaign has been successfully deleted',
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete campaign',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <Link href="/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">No campaigns yet</p>
          <Link href="/new">
            <Button>Create Your First Campaign</Button>
          </Link>
        </div>
      ) : (
        <CampaignsTable campaigns={campaigns} onDelete={deleteCampaign} />
      )}
    </div>
  )
}
