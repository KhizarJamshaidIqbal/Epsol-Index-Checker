import { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import { Resend } from 'resend'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM || 'noreply@epsol.local',
      // Custom send function using Resend
      async sendVerificationRequest({ identifier: email, url }) {
        try {
          // Development mode fallback
          if (!process.env.RESEND_API_KEY) {
            console.log('\n' + '='.repeat(80))
            console.log('🔐 MAGIC LINK AUTHENTICATION')
            console.log('='.repeat(80))
            console.log(`📧 Email: ${email}`)
            console.log(`🔗 Magic Link: ${url}`)
            console.log('='.repeat(80))
            console.log('👆 Copy the link above and paste it in your browser to sign in')
            console.log('⚠️  RESEND_API_KEY not set - showing link in console')
            console.log('='.repeat(80) + '\n')
            return
          }

          console.log(`📧 Sending magic link via Resend to ${email}...`)

          const resend = new Resend(process.env.RESEND_API_KEY)

          const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: email,
            subject: 'Sign in to Epsol Index Checker',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0070f3;">Welcome to Epsol Index Checker</h2>
                <p>Click the button below to sign in to your account:</p>
                <a href="${url}" style="display: inline-block; background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Sign In</a>
                <p>Or copy and paste this URL into your browser:</p>
                <p style="color: #666; word-break: break-all;">${url}</p>
                <p style="color: #999; font-size: 12px; margin-top: 40px;">If you did not request this email, you can safely ignore it.</p>
              </div>
            `,
          })

          if (error) {
            console.error('❌ Resend error:', error)
            throw new Error(`Failed to send email via Resend: ${error.message}`)
          }

          console.log(`✅ Email sent successfully via Resend! ID: ${data?.id}`)
        } catch (error) {
          console.error('❌ Failed to send email:', error)
          throw new Error(`Failed to send verification email: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
}
