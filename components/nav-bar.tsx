'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'

export function NavBar() {
  const { data: session } = useSession()

  if (!session) {
    return (
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Epsol Index Checker
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/campaigns" className="text-xl font-bold">
              Epsol Index Checker
            </Link>
            <div className="flex gap-4">
              <Link
                href="/campaigns"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Campaigns
              </Link>
              <Link
                href="/new"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                New Campaign
              </Link>
              <Link
                href="/settings"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Settings
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user?.email}</span>
            <ThemeToggle />
            <Link
              href="/api/auth/signout"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
