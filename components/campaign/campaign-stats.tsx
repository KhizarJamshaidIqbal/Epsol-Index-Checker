'use client'

import { StatsCard } from '@/components/stats-card'
import { FileCheck, FileX, AlertCircle } from 'lucide-react'

interface CampaignStatsProps {
  stats: {
    total: number
    indexed: number
    notIndexed: number
    errors: number
  }
}

export function CampaignStats({ stats }: CampaignStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard title="Total URLs" value={stats.total} icon={FileCheck} />
      <StatsCard
        title="Indexed"
        value={stats.indexed}
        icon={FileCheck}
        description={`${Math.round((stats.indexed / stats.total) * 100)}%`}
      />
      <StatsCard
        title="Not Indexed"
        value={stats.notIndexed}
        icon={FileX}
        description={`${Math.round((stats.notIndexed / stats.total) * 100)}%`}
      />
      <StatsCard title="Errors" value={stats.errors} icon={AlertCircle} />
    </div>
  )
}
