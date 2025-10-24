'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { useCampaignData } from '@/hooks/use-campaign-data'
import { CampaignHeader } from '@/components/campaign/campaign-header'
import { CampaignStats } from '@/components/campaign/campaign-stats'
import { CampaignFilters } from '@/components/campaign/campaign-filters'
import { UrlItemsTable } from '@/components/campaign/url-items-table'
import { DeleteUrlDialog } from '@/components/campaign/delete-url-dialog'

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const campaignId = params.id as string

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch campaign data
  const { campaign, items, loading, itemsLoading, error, refresh } = useCampaignData(
    campaignId,
    statusFilter,
    searchQuery
  )

  // Action states
  const [rechecking, setRechecking] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string; url: string } | null>(null)

  async function recheckAll() {
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

      toast({
        title: "Recheck Started",
        description: `Queued ${data.data.queued} URL${data.data.queued !== 1 ? 's' : ''} for checking`,
      })
      refresh()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to recheck',
      })
    } finally {
      setRechecking(false)
    }
  }

  function exportCSV() {
    window.open(`/api/export/${campaignId}`, '_blank')
  }

  // Selection handlers
  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedItems(new Set(items.map((item) => item.id)))
      setSelectAll(true)
    } else {
      setSelectedItems(new Set())
      setSelectAll(false)
    }
  }

  function handleSelectItem(itemId: string, checked: boolean) {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(itemId)
    } else {
      newSelected.delete(itemId)
    }
    setSelectedItems(newSelected)
    setSelectAll(newSelected.size === items.length && items.length > 0)
  }

  // Delete handlers
  async function deleteSelected() {
    if (selectedItems.size === 0) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/items/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: Array.from(selectedItems) }),
      })

      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to delete URLs')
      }

      toast({
        title: "URLs Deleted",
        description: data.data.message,
      })
      setSelectedItems(new Set())
      setSelectAll(false)
      refresh()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete URLs',
      })
    } finally {
      setDeleting(false)
    }
  }

  async function deleteItem(itemId: string, url: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/items/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: [itemId] }),
      })

      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to delete URL')
      }

      toast({
        title: "URL Deleted",
        description: "URL removed from campaign successfully",
      })
      refresh()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete URL',
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
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
      <CampaignHeader
        campaignName={campaign.name}
        campaignStatus={campaign.status}
        selectedCount={selectedItems.size}
        rechecking={rechecking}
        deleting={deleting}
        campaignId={campaignId}
        stats={campaign.stats}
        onRecheck={recheckAll}
        onExport={exportCSV}
        onDeleteSelected={deleteSelected}
        onRefresh={refresh}
      />

      <CampaignStats stats={campaign.stats} />

      <CampaignFilters
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
      />

      <UrlItemsTable
        items={items}
        loading={itemsLoading}
        campaignStatus={campaign.status}
        selectedItems={selectedItems}
        selectAll={selectAll}
        deleting={deleting}
        onSelectAll={handleSelectAll}
        onSelectItem={handleSelectItem}
        onDeleteClick={(itemId, url) => {
          setItemToDelete({ id: itemId, url })
          setDeleteDialogOpen(true)
        }}
      />

      <DeleteUrlDialog
        open={deleteDialogOpen}
        url={itemToDelete?.url || null}
        deleting={deleting}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          if (itemToDelete) {
            deleteItem(itemToDelete.id, itemToDelete.url)
          }
        }}
      />
    </div>
  )
}
