'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ManualEntryProps {
  urls: string
  onUrlsChange: (urls: string) => void
  urlCount: number
}

export function ManualEntry({ urls, onUrlsChange, urlCount }: ManualEntryProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="urls">URLs (one per line)</Label>
      <Textarea
        id="urls"
        value={urls}
        onChange={(e) => onUrlsChange(e.target.value)}
        placeholder="https://example.com&#10;https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/blog/article"
        className="min-h-[350px] font-mono text-sm"
      />
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          {urlCount} URL{urlCount !== 1 ? 's' : ''} entered
        </p>
        {urlCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onUrlsChange('')}
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
