'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, FileText, Table as TableIcon, X, Check } from 'lucide-react'

interface FileUploadProps {
  uploadedFile: File | null
  parsedUrls: string[]
  parsing: boolean
  dragActive: boolean
  onFileUpload: (file: File) => void
  onClearFile: () => void
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

export function FileUpload({
  uploadedFile,
  parsedUrls,
  parsing,
  dragActive,
  onFileUpload,
  onClearFile,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0])
    }
  }

  return (
    <div className="space-y-4">
      {!uploadedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv,.txt,.xlsx,.xls"
            onChange={handleFileChange}
          />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Upload a file</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop your file here, or click to browse
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose File
          </Button>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>Supported: CSV, TXT, Excel (XLSX, XLS)</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-primary/10">
                {uploadedFile.name.endsWith('.csv') || uploadedFile.name.endsWith('.txt') ? (
                  <FileText className="h-5 w-5 text-primary" />
                ) : (
                  <TableIcon className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFile}
              disabled={parsing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {parsing ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Parsing file...</span>
            </div>
          ) : parsedUrls.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Extracted URLs</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  {parsedUrls.length} URLs found
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-muted/30 max-h-[300px] overflow-y-auto">
                <div className="space-y-1 font-mono text-xs">
                  {parsedUrls.slice(0, 50).map((url, idx) => (
                    <div key={idx} className="text-muted-foreground">
                      {idx + 1}. {url}
                    </div>
                  ))}
                  {parsedUrls.length > 50 && (
                    <p className="text-muted-foreground italic mt-2">
                      ... and {parsedUrls.length - 50} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              No URLs found in file
            </div>
          )}
        </div>
      )}
    </div>
  )
}
