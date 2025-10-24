import { Badge } from './ui/badge'

type UrlStatus = 'NOT_FETCHED' | 'INDEXED' | 'NOT_INDEXED' | 'ERROR'
type CampaignStatus = 'READY' | 'RUNNING' | 'COMPLETE'

interface StatusBadgeProps {
  status: UrlStatus | CampaignStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<string, { variant: any; label: string }> = {
    INDEXED: { variant: 'success', label: 'Indexed' },
    NOT_INDEXED: { variant: 'warning', label: 'Not Indexed' },
    ERROR: { variant: 'error', label: 'Error' },
    NOT_FETCHED: { variant: 'secondary', label: 'Not Fetched' },
    READY: { variant: 'secondary', label: 'Ready' },
    RUNNING: { variant: 'default', label: 'Running' },
    COMPLETE: { variant: 'success', label: 'Complete' },
  }

  const config = variants[status] || { variant: 'secondary', label: status }

  return <Badge variant={config.variant}>{config.label}</Badge>
}
