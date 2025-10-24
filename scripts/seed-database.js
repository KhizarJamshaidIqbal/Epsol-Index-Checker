const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

// Encryption configuration
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

function getKey() {
  const key = process.env.EPSOL_KMS_KEY
  if (!key) {
    throw new Error('EPSOL_KMS_KEY environment variable is not set')
  }
  return Buffer.from(key, 'base64')
}

function encrypt(text) {
  if (!text) return ''

  try {
    const key = getKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

async function main() {
  console.log('🌱 Starting database seeding...')

  // Google API credentials
  const googleApiKey = 'AIzaSyCvf2r6dXYo1kPyNSOEbmWnfWYFdU_BSOA'
  const googleCx = '255b32e558aeb42bf'

  try {
    // Create a default user for development
    const user = await prisma.user.upsert({
      where: { email: 'admin@epsol.local' },
      update: {},
      create: {
        email: 'admin@epsol.local',
        name: 'Admin User',
        emailVerified: new Date(),
      },
    })

    console.log('✅ Created/found user:', user.email)

    // Encrypt and store Google API credentials
    const encryptedApiKey = encrypt(googleApiKey)
    const encryptedCx = encrypt(googleCx)

    const settings = await prisma.setting.upsert({
      where: { userId: user.id },
      update: {
        googleKey: encryptedApiKey,
        googleCx: encryptedCx,
      },
      create: {
        userId: user.id,
        googleKey: encryptedApiKey,
        googleCx: encryptedCx,
      },
    })

    console.log('✅ Google API credentials encrypted and stored')
    console.log('   - API Key: AIzaSy...BSOA (encrypted)')
    console.log('   - CX: 255b32...42bf (encrypted)')

    // Create test campaign with sample URLs
    console.log('\n📋 Creating test campaign...')
    
    const testCampaign = await prisma.campaign.upsert({
      where: { 
        id: 'test-campaign-id' 
      },
      update: {},
      create: {
        id: 'test-campaign-id',
        name: 'Test Campaign - Epsoldev Blog URLs',
        userId: user.id,
        status: 'READY',
        items: {
          create: [
            {
              url: 'https://epsoldev.com/blog/custom-software-vs-off-the-shelf-solutions-which-is-best-for-your-business-in-2025',
              status: 'NOT_FETCHED',
            },
            {
              url: 'https://epsoldev.com/blog/how-to-host-n8n-on-hostinger-full-installation-setup-guide-2025',
              status: 'NOT_FETCHED',
            },
          ],
        },
      },
      include: {
        items: true,
      },
    })

    console.log('✅ Test campaign created:', testCampaign.name)
    console.log('   - Total URLs:', testCampaign.items.length)
    console.log('   - URL 1 (Should be INDEXED):', testCampaign.items[0].url.substring(0, 80) + '...')
    console.log('   - URL 2 (Should be NOT_INDEXED):', testCampaign.items[1].url.substring(0, 80) + '...')

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\nDefault user credentials:')
    console.log('  Email: admin@epsol.local')
    console.log('\nNote: Use magic link authentication to sign in.')
    console.log('\n🧪 Test Campaign Details:')
    console.log('  Campaign ID:', testCampaign.id)
    console.log('  Campaign Name:', testCampaign.name)
    console.log('  Status:', testCampaign.status)
    console.log('\n  To test the system:')
    console.log('  1. Log in with admin@epsol.local')
    console.log('  2. Go to the test campaign')
    console.log('  3. Click "Check URLs" to verify indexing status')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
