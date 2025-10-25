import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { NavBar } from '@/components/nav-bar'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Epsol - Google Index Checker',
  description: 'Check if your URLs are indexed on Google at scale',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen bg-background text-foreground transition-colors">
            <NavBar />
            <main className="container mx-auto px-4 py-8">{children}</main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
