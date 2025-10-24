import { useState, useEffect } from 'react'

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

export function useCampaignData(
  campaignId: string,
  statusFilter: string,
  searchQuery: string
) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [items, setItems] = useState<UrlItem[]>([])
  const [loading, setLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  function refresh() {
    fetchCampaign()
    fetchItems()
  }

  useEffect(() => {
    fetchCampaign()
    fetchItems()

    // Auto-refresh items every 3 seconds if campaign is running
    const interval = setInterval(() => {
      if (campaign?.status === 'RUNNING') {
        fetchCampaign()
        fetchItems()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [campaignId, statusFilter, searchQuery])

  return {
    campaign,
    items,
    loading,
    itemsLoading,
    error,
    refresh,
  }
}
