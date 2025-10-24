'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatsCard } from '@/components/stats-card'
import { StatusBadge } from '@/components/status-badge'
import { Loader2, Download, RefreshCw, Search, FileCheck, FileX, AlertCircle } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  status: string
  stats: {
    total: number
    indexed: number
    notIndexed: number
    errors: number
    notFetched: number
    progress: number
  }
}

interface UrlItem {
  id: string
  number: number
  url: string
  status: 'NOT_FETCHED' | 'INDEXED' | 'NOT_INDEXED' | 'ERROR'
  title: string | null
  snippet: string | null
  reason: string | null
  checkedAt: string | null
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [items, setItems] = useState<UrlItem[]>([])
  const [loading, setLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [rechecking, setRechecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchCampaign()
    fetchItems()
    // Auto-refresh items every 5 seconds if campaign is running
    const interval = setInterval(() => {
      if (campaign?.status === 'RUNNING') {
        fetchCampaign()
        fetchItems()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [campaignId, statusFilter, searchQuery])

  async function fetchCampaign() {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`)
      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch campaign')
      }

      setCampaign(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }

  async function fetchItems() {
    setItemsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/campaigns/${campaignId}/items?${params}`)
      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch items')
      }

      setItems(data.data.items)
    } catch (err) {
      console.error('Failed to fetch items:', err)
    } finally {
      setItemsLoading(false)
    }
  }

  async function recheckAll() {
    if (!confirm('Recheck all URLs that are not indexed or have errors?')) return

    setRechecking(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/recheck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to start recheck')
      }

      alert(`Queued ${data.data.queued} URLs for checking`)
      fetchCampaign()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to recheck')
    } finally {
      setRechecking(false)
    }
  }

  function exportCSV() {
    window.open(`/api/export/${campaignId}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="text-center">
        <p className="text-destructive mb-4">{error || 'Campaign not found'}</p>
        <Button onClick={() => router.push('/campaigns')}>Back to Campaigns</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <p className="text-muted-foreground mt-1">
            <StatusBadge status={campaign.status as any} />
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={recheckAll} disabled={rechecking}>
            {rechecking ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Recheck All
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total URLs" value={campaign.stats.total} icon={FileCheck} />
        <StatsCard
          title="Indexed"
          value={campaign.stats.indexed}
          icon={FileCheck}
          description={`${Math.round((campaign.stats.indexed / campaign.stats.total) * 100)}%`}
        />
        <StatsCard
          title="Not Indexed"
          value={campaign.stats.notIndexed}
          icon={FileX}
          description={`${Math.round((campaign.stats.notIndexed / campaign.stats.total) * 100)}%`}
        />
        <StatsCard title="Errors" value={campaign.stats.errors} icon={AlertCircle} />
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search URLs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="INDEXED">Indexed</option>
          <option value="NOT_INDEXED">Not Indexed</option>
          <option value="ERROR">Errors</option>
          <option value="NOT_FETCHED">Not Fetched</option>
        </select>
      </div>

      {/* Items Table */}
      <div className="border rounded-lg">
        {itemsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">No URLs found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Checked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.number}</TableCell>
                  <TableCell className="max-w-md truncate">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {item.url}
                    </a>
                  </TableCell>
                  <TableCell className="max-w-md">
                    {item.title || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <StatusBadge status={item.status} />
                      {item.reason && (
                        <p className="text-xs text-muted-foreground">{item.reason}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.checkedAt ? new Date(item.checkedAt).toLocaleString() : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
