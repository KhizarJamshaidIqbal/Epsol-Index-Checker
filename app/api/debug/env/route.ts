import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/debug/env
 * Check which environment variables are configured (without exposing values)
 * This helps diagnose configuration issues on Vercel
 */
export async function GET(request: NextRequest) {
  // Only allow in development or if secret key is provided
  const secret = request.nextUrl.searchParams.get('secret')
  
  if (process.env.NODE_ENV === 'production' && secret !== process.env.DEBUG_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const envCheck = {
    // Email Configuration
    EMAIL_SERVER_HOST: !!process.env.EMAIL_SERVER_HOST,
    EMAIL_SERVER_PORT: !!process.env.EMAIL_SERVER_PORT,
    EMAIL_SERVER_USER: !!process.env.EMAIL_SERVER_USER,
    EMAIL_SERVER_PASSWORD: !!process.env.EMAIL_SERVER_PASSWORD,
    EMAIL_FROM: !!process.env.EMAIL_FROM,
    
    // NextAuth Configuration
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    
    // Database
    DATABASE_URL: !!process.env.DATABASE_URL,
    
    // Values (first 4 chars only for verification)
    EMAIL_SERVER_HOST_value: process.env.EMAIL_SERVER_HOST?.substring(0, 4) || 'NOT_SET',
    EMAIL_SERVER_PORT_value: process.env.EMAIL_SERVER_PORT || 'NOT_SET',
    EMAIL_FROM_value: process.env.EMAIL_FROM?.substring(0, 10) || 'NOT_SET',
    NEXTAUTH_URL_value: process.env.NEXTAUTH_URL?.substring(0, 20) || 'NOT_SET',
    
    // Environment
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
  }

  return NextResponse.json({
    ok: true,
    data: envCheck,
    message: 'Environment variable check',
    allEmailVarsSet: 
      envCheck.EMAIL_SERVER_HOST &&
      envCheck.EMAIL_SERVER_PORT &&
      envCheck.EMAIL_SERVER_USER &&
      envCheck.EMAIL_SERVER_PASSWORD &&
      envCheck.EMAIL_FROM,
  })
}
