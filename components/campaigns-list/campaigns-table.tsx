'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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

interface CampaignsTableProps {
  campaigns: Campaign[]
  onDelete: (id: string) => void
}

export function CampaignsTable({ campaigns, onDelete }: CampaignsTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign Name</TableHead>
            <TableHead>URLs</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell className="font-medium">
                <Link href={`/campaigns/${campaign.id}`} className="hover:underline">
                  {campaign.name}
                </Link>
              </TableCell>
              <TableCell>{campaign.totalUrls}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${campaign.progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">{campaign.progress}%</span>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={campaign.status} />
              </TableCell>
              <TableCell>{new Date(campaign.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right space-x-2">
                <Link href={`/campaigns/${campaign.id}`}>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(campaign.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
