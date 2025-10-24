'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn('email', {
        email,
        callbackUrl: '/campaigns',
      })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Epsol Index Checker</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to check your URLs indexing status
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {error === 'OAuthSignin' && 'Error signing in. Please try again.'}
            {error === 'OAuthCallback' && 'Error during callback. Please try again.'}
            {error === 'OAuthCreateAccount' && 'Could not create account. Please try again.'}
            {error === 'EmailCreateAccount' && 'Could not create account. Please try again.'}
            {error === 'Callback' && 'Error during authentication. Please try again.'}
            {error === 'OAuthAccountNotLinked' &&
              'This email is already associated with another account.'}
            {error === 'EmailSignin' && 'Could not send email. Please check your email address.'}
            {error === 'CredentialsSignin' && 'Invalid credentials.'}
            {!error.match(/OAuth|Email|Credentials|Callback/) && 'An error occurred. Please try again.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="admin@epsol.local"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Sending magic link...' : 'Sign in with Email'}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            We'll send you a magic link to sign in without a password.
          </p>
        </form>

        <div className="mt-4 rounded-md bg-muted p-4 text-xs text-muted-foreground">
          <p className="font-medium">Development Mode:</p>
          <p className="mt-1">Use email: <code className="rounded bg-background px-1 py-0.5">admin@epsol.local</code></p>
          <p className="mt-1">Check your terminal/console for the magic link (no email server configured)</p>
        </div>
      </div>
    </div>
  )
}
