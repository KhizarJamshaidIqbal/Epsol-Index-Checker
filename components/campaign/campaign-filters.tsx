'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface CampaignFiltersProps {
  searchQuery: string
  statusFilter: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function CampaignFilters({
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusChange,
}: CampaignFiltersProps) {
  return (
    <div className="flex gap-4 items-center">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search URLs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="all">All Status</option>
        <option value="INDEXED">Indexed</option>
        <option value="NOT_INDEXED">Not Indexed</option>
        <option value="ERROR">Errors</option>
        <option value="NOT_FETCHED">Not Fetched</option>
      </select>
    </div>
  )
}
