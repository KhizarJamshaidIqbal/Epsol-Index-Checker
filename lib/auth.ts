import { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || 'localhost',
        port: Number(process.env.EMAIL_SERVER_PORT) || 465,
        secure: true, // Use SSL/TLS
        auth: {
          user: process.env.EMAIL_SERVER_USER || '',
          pass: process.env.EMAIL_SERVER_PASSWORD || '',
        },
      },
      from: process.env.EMAIL_FROM || 'noreply@epsol.local',
      // Custom send function
      async sendVerificationRequest({ identifier: email, url }) {
        // Development mode fallback
        if (!process.env.EMAIL_SERVER_HOST) {
          console.log('\n' + '='.repeat(80))
          console.log('🔐 MAGIC LINK AUTHENTICATION')
          console.log('='.repeat(80))
          console.log(`📧 Email: ${email}`)
          console.log(`🔗 Magic Link: ${url}`)
          console.log('='.repeat(80))
          console.log('👆 Copy the link above and paste it in your browser to sign in')
          console.log('='.repeat(80) + '\n')
          return
        }

        // Production: use nodemailer with SSL/TLS
        const nodemailer = await import('nodemailer')
        const transport = nodemailer.createTransport({
          host: process.env.EMAIL_SERVER_HOST,
          port: Number(process.env.EMAIL_SERVER_PORT),
          secure: true, // Use SSL/TLS
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        })

        await transport.sendMail({
          to: email,
          from: process.env.EMAIL_FROM,
          subject: 'Sign in to Epsol Index Checker',
          text: `Sign in to Epsol Index Checker\n\nClick here to sign in: ${url}\n\n`,
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
