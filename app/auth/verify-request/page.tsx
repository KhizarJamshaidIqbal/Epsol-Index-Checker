export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-lg text-center">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight">Check your email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A sign in link has been sent to your email address.
          </p>
        </div>

        <div className="mt-6 rounded-md bg-muted p-4 text-left">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Development Mode:</span>
            <br />
            Since no email server is configured, check your <span className="font-mono text-xs">terminal/console</span> for the magic link URL.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Look for a line like:<br />
            <code className="mt-1 block rounded bg-background p-2 text-xs">
              http://localhost:3001/api/auth/callback/email?token=...
            </code>
          </p>
        </div>

        <div className="mt-6">
          <a
            href="/auth/signin"
            className="text-sm font-medium text-primary hover:text-primary/90"
          >
            ← Back to sign in
          </a>
        </div>
      </div>
    </div>
  )
}
