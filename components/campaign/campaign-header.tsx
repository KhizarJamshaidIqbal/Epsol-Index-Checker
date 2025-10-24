'use client'

import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { AddUrlsDialog } from '@/components/add-urls-dialog'
import { AnalyticsDialog } from './analytics-dialog'
import { Loader2, Download, RefreshCw, Trash2 } from 'lucide-react'

interface CampaignHeaderProps {
  campaignName: string
  campaignStatus: string
  selectedCount: number
  rechecking: boolean
  deleting: boolean
  campaignId: string
  stats: {
    total: number
    indexed: number
    notIndexed: number
    errors: number
    notFetched: number
    progress: number
  }
  onRecheck: () => void
  onExport: () => void
  onDeleteSelected: () => void
  onRefresh: () => void
}

export function CampaignHeader({
  campaignName,
  campaignStatus,
  selectedCount,
  rechecking,
  deleting,
  campaignId,
  stats,
  onRecheck,
  onExport,
  onDeleteSelected,
  onRefresh,
}: CampaignHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">{campaignName}</h1>
        <p className="text-muted-foreground mt-1">
          <StatusBadge status={campaignStatus as any} />
        </p>
      </div>
      <div className="flex gap-2">
        {selectedCount > 0 && (
          <Button
            variant="destructive"
            onClick={onDeleteSelected}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete Selected ({selectedCount})
          </Button>
        )}
        <AnalyticsDialog stats={stats} campaignName={campaignName} />
        <AddUrlsDialog campaignId={campaignId} onSuccess={onRefresh} />
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button onClick={onRecheck} disabled={rechecking}>
          {rechecking ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Recheck All
        </Button>
      </div>
    </div>
  )
}
