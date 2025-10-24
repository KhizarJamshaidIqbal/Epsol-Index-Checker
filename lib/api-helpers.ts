import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'
import type { Session } from 'next-auth'

/**
 * Get the current user session
 */
export async function getCurrentUser(): Promise<Session['user'] | null> {
  const session = await getServerSession(authOptions)
  return session?.user || null
}

/**
 * API Response helpers
 */
export function apiSuccess<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ ok: true, data }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function apiError(error: string, status = 400): Response {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function apiUnauthorized(): Response {
  return apiError('Unauthorized. Please sign in.', 401)
}

/**
 * Require authentication middleware
 */
export async function requireAuth(): Promise<Session['user']> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
