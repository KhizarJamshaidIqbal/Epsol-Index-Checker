'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const [googleKey, setGoogleKey] = useState('')
  const [googleCx, setGoogleCx] = useState('')
  const [hasGoogleKey, setHasGoogleKey] = useState(false)
  const [hasGoogleCx, setHasGoogleCx] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch settings')
      }

      setHasGoogleKey(data.data.hasGoogleKey)
      setHasGoogleCx(data.data.hasGoogleCx)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleKey: googleKey || undefined,
          googleCx: googleCx || undefined,
        }),
      })

      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to save settings')
      }

      setHasGoogleKey(data.data.hasGoogleKey)
      setHasGoogleCx(data.data.hasGoogleCx)
      setGoogleKey('')
      setGoogleCx('')
      setSuccess(true)

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Google Programmable Search API</CardTitle>
            <CardDescription>
              Configure your Google API credentials to check URL indexing status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="googleKey">
                API Key
                {hasGoogleKey && (
                  <span className="ml-2 text-xs text-green-500">(Currently set)</span>
                )}
              </Label>
              <Input
                id="googleKey"
                type="password"
                value={googleKey}
                onChange={(e) => setGoogleKey(e.target.value)}
                placeholder={hasGoogleKey ? '••••••••••••••••' : 'Enter your Google API key'}
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Google Cloud Console
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleCx">
                Search Engine ID (CX)
                {hasGoogleCx && <span className="ml-2 text-xs text-green-500">(Currently set)</span>}
              </Label>
              <Input
                id="googleCx"
                value={googleCx}
                onChange={(e) => setGoogleCx(e.target.value)}
                placeholder={hasGoogleCx ? '••••••••••••••••' : 'Enter your Search Engine ID'}
              />
              <p className="text-xs text-muted-foreground">
                Create a Custom Search Engine at{' '}
                <a
                  href="https://programmablesearchengine.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Programmable Search Engine
                </a>
                . Make sure to enable "Search the entire web"
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-green-500">Settings saved successfully!</p>}
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </form>
    </div>
  )
}
