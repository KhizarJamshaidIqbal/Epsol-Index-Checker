const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

// Encryption configuration
const ALGORITHM = 'aes-256-gcm'

function getKey() {
  const key = process.env.EPSOL_KMS_KEY
  if (!key) {
    throw new Error('EPSOL_KMS_KEY environment variable is not set')
  }
  return Buffer.from(key, 'base64')
}

function decrypt(encryptedText) {
  if (!encryptedText) return ''

  try {
    const key = getKey()
    const parts = encryptedText.split(':')

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

async function checkIndexExact(url, key, cx) {
  try {
    // Build the query with exact URL match
    const q = `"${url}"`
    const endpoint = new URL('https://www.googleapis.com/customsearch/v1')
    endpoint.searchParams.set('key', key)
    endpoint.searchParams.set('cx', cx)
    endpoint.searchParams.set('q', q)
    endpoint.searchParams.set('num', '3')

    console.log(`\n🔍 Checking: ${url}`)
    console.log(`   Query: ${q}`)

    const res = await fetch(endpoint.toString())

    if (!res.ok) {
      const errorText = await res.text()
      console.log(`   ❌ API Error: ${res.status}`)
      console.log(`   Response: ${errorText.substring(0, 200)}`)
      return { status: 'ERROR', title: '', snippet: '', reason: `API error: ${res.status}` }
    }

    const data = await res.json()
    const items = data.items ?? []

    console.log(`   📊 Results found: ${items.length}`)

    // Look for exact match
    const normalizedUrl = url.replace(/\/$/, '')
    const match = items.find((item) => {
      const itemLink = item?.link?.replace(/\/$/, '')
      return itemLink === normalizedUrl
    })

    if (match) {
      console.log(`   ✅ INDEXED!`)
      console.log(`   📝 Title: ${match.title}`)
      console.log(`   📄 Snippet: ${match.snippet?.substring(0, 100)}...`)
      return {
        status: 'INDEXED',
        title: match.title,
        snippet: match.snippet,
        reason: null,
      }
    }

    console.log(`   ⚠️  NOT INDEXED - No exact match found`)
    return {
      status: 'NOT_INDEXED',
      title: '',
      snippet: '',
      reason: 'No exact match found in Google results',
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
    return {
      status: 'ERROR',
      title: '',
      snippet: '',
      reason: error.message,
    }
  }
}

async function main() {
  console.log('🧪 Testing Index Checker System\n')
  console.log('=' .repeat(80))

  try {
    // Get user and settings
    const user = await prisma.user.findUnique({
      where: { email: 'admin@epsol.local' },
      include: {
        settings: true,
      },
    })

    if (!user || !user.settings) {
      console.error('❌ User or settings not found. Run seed-database.js first.')
      process.exit(1)
    }

    console.log('✅ User found:', user.email)

    // Decrypt API credentials
    const googleKey = decrypt(user.settings.googleKey)
    const googleCx = decrypt(user.settings.googleCx)

    console.log('✅ API credentials decrypted')
    console.log(`   API Key: ${googleKey.substring(0, 15)}...`)
    console.log(`   CX: ${googleCx}`)

    // Get test campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: 'test-campaign-id' },
      include: {
        items: true,
      },
    })

    if (!campaign) {
      console.error('\n❌ Test campaign not found. Run seed-database.js first.')
      process.exit(1)
    }

    console.log('\n📋 Test Campaign:', campaign.name)
    console.log(`   URLs to check: ${campaign.items.length}`)

    // Check each URL
    console.log('\n' + '='.repeat(80))
    console.log('🔍 CHECKING URLs FOR INDEXING STATUS')
    console.log('='.repeat(80))

    for (const item of campaign.items) {
      const result = await checkIndexExact(item.url, googleKey, googleCx)

      // Update the database with results
      await prisma.urlItem.update({
        where: { id: item.id },
        data: {
          status: result.status,
          title: result.title || null,
          snippet: result.snippet || null,
          reason: result.reason || null,
          checkedAt: new Date(),
        },
      })

      console.log(`   💾 Database updated with status: ${result.status}`)
      
      // Wait a bit between requests to avoid rate limiting
      if (campaign.items.indexOf(item) < campaign.items.length - 1) {
        console.log('\n   ⏳ Waiting 2 seconds before next check...')
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    // Show final results
    console.log('\n' + '='.repeat(80))
    console.log('📊 FINAL RESULTS')
    console.log('='.repeat(80))

    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id: 'test-campaign-id' },
      include: {
        items: true,
      },
    })

    updatedCampaign.items.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.url}`)
      console.log(`   Status: ${item.status}`)
      if (item.title) console.log(`   Title: ${item.title}`)
      if (item.reason) console.log(`   Reason: ${item.reason}`)
      console.log(`   Checked at: ${item.checkedAt}`)
    })

    console.log('\n' + '='.repeat(80))
    console.log('✅ TEST COMPLETED SUCCESSFULLY!')
    console.log('='.repeat(80))
    console.log('\n💡 You can now view these results in the web app at:')
    console.log('   http://localhost:3001')
    console.log('   Login with: admin@epsol.local')
  } catch (error) {
    console.error('\n❌ Test failed:', error)
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
