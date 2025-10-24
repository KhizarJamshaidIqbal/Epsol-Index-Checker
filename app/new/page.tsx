'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Upload, FileText } from 'lucide-react'
import { ManualEntry } from '@/components/url-input/manual-entry'
import { FileUpload } from '@/components/url-input/file-upload'
import { parseFile } from '@/lib/file-parser'

export default function NewCampaignPage() {
  const router = useRouter()
  
  const [name, setName] = useState('')
  const [urls, setUrls] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('manual')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parsedUrls, setParsedUrls] = useState<string[]>([])
  const [parsing, setParsing] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const urlCount = activeTab === 'manual' 
    ? urls.split('\n').filter((line) => line.trim().length > 0).length
    : parsedUrls.length

  async function handleFileUpload(file: File) {
    setParsing(true)
    setError(null)
    setUploadedFile(file)

    try {
      const extractedUrls = await parseFile(file)
      setParsedUrls(extractedUrls)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file')
    } finally {
      setParsing(false)
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  function clearFile() {
    setUploadedFile(null)
    setParsedUrls([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const urlList = activeTab === 'manual'
        ? urls.split('\n').map((line) => line.trim()).filter((line) => line.length > 0)
        : parsedUrls

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, urls: urlList }),
      })

      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to create campaign')
      }

      router.push(`/campaigns/${data.data.campaign.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Campaign</h1>
        <p className="text-muted-foreground mt-2">Add URLs manually or import from a file</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Name</CardTitle>
            <CardDescription>Give your campaign a descriptive name</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Website Index Check - January 2025"
              className="text-base"
              required
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add URLs</CardTitle>
            <CardDescription>Choose how you want to add URLs to this campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Manual Entry
                </TabsTrigger>
                <TabsTrigger value="file" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import from File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="mt-4">
                <ManualEntry
                  urls={urls}
                  onUrlsChange={setUrls}
                  urlCount={urlCount}
                />
              </TabsContent>

              <TabsContent value="file" className="mt-4">
                <FileUpload
                  uploadedFile={uploadedFile}
                  parsedUrls={parsedUrls}
                  parsing={parsing}
                  dragActive={dragActive}
                  onFileUpload={handleFileUpload}
                  onClearFile={clearFile}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                />
              </TabsContent>
            </Tabs>

            {error && (
              <div className="mt-4 p-3 rounded-md bg-destructive/10 text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={loading || !name || urlCount === 0}
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Campaign ({urlCount} URLs)
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
