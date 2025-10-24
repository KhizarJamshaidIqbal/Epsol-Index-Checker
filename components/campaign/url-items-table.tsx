'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { StatusBadge } from '@/components/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Trash2 } from 'lucide-react'

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

interface UrlItemsTableProps {
  items: UrlItem[]
  loading: boolean
  campaignStatus: string
  selectedItems: Set<string>
  selectAll: boolean
  deleting: boolean
  onSelectAll: (checked: boolean) => void
  onSelectItem: (itemId: string, checked: boolean) => void
  onDeleteClick: (itemId: string, url: string) => void
}

export function UrlItemsTable({
  items,
  loading,
  campaignStatus,
  selectedItems,
  selectAll,
  deleting,
  onSelectAll,
  onSelectItem,
  onDeleteClick,
}: UrlItemsTableProps) {
  if (loading) {
    return (
      <div className="border rounded-lg">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="border rounded-lg">
        <div className="text-center p-8 text-muted-foreground">No URLs found</div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectAll}
                onCheckedChange={onSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="w-12">#</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Checked</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className={`transition-colors ${
                item.status === 'INDEXED'
                  ? 'hover:bg-green-500/5'
                  : item.status === 'NOT_INDEXED'
                  ? 'hover:bg-orange-500/5'
                  : item.status === 'ERROR'
                  ? 'hover:bg-red-500/5'
                  : 'hover:bg-muted/50'
              }`}
            >
              <TableCell>
                <Checkbox
                  checked={selectedItems.has(item.id)}
                  onCheckedChange={(checked) => onSelectItem(item.id, checked as boolean)}
                  aria-label={`Select ${item.url}`}
                />
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {item.number}
              </TableCell>
              <TableCell className="max-w-md">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline truncate block"
                  title={item.url}
                >
                  {item.url}
                </a>
              </TableCell>
              <TableCell className="max-w-md">
                <div className="truncate" title={item.title || ''}>
                  {item.title || <span className="text-muted-foreground italic">No title</span>}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <StatusBadge status={item.status} />
                  {item.reason && (
                    <p className="text-xs text-muted-foreground max-w-xs truncate" title={item.reason}>
                      {item.reason}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {item.checkedAt ? (
                  <div className="flex items-center gap-2">
                    <span>{new Date(item.checkedAt).toLocaleString()}</span>
                    {campaignStatus === 'RUNNING' && item.status === 'NOT_FETCHED' && (
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    )}
                  </div>
                ) : campaignStatus === 'RUNNING' ? (
                  <div className="flex items-center gap-2 text-blue-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Checking...</span>
                  </div>
                ) : (
                  <span>—</span>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteClick(item.id, item.url)}
                  disabled={deleting}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  title="Delete this URL"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
