import type { Metadata } from 'next'
import './globals.css'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Epsol - Google Index Checker',
  description: 'Check if your URLs are indexed on Google at scale',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-background">
          {session && (
            <nav className="border-b">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <Link href="/campaigns" className="text-xl font-bold">
                      Epsol
                    </Link>
                    <div className="flex gap-4">
                      <Link
                        href="/campaigns"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Campaigns
                      </Link>
                      <Link
                        href="/new"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        New Campaign
                      </Link>
                      <Link
                        href="/settings"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Settings
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{session.user.email}</span>
                    <Link
                      href="/api/auth/signout"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Sign Out
                    </Link>
                  </div>
                </div>
              </div>
            </nav>
          )}
          <main className="container mx-auto px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  )
}
