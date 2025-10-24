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

function decrypt(encrypted) {
  if (!encrypted) return ''

  try {
    const key = getKey()
    const parts = encrypted.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encryptedText = parts[2]

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

async function checkIndexExact(url, key, cx) {
  try {
    // Parse URL to extract domain and path for site: search
    let searchQuery
    try {
      const urlObj = new URL(url)
      // Use site: operator for more accurate index checking
      const siteQuery = `${urlObj.hostname}${urlObj.pathname}${urlObj.search}`
      searchQuery = `site:${siteQuery}`
    } catch {
      searchQuery = `"${url}"`
    }

    const endpoint = new URL('https://www.googleapis.com/customsearch/v1')
    endpoint.searchParams.set('key', key)
    endpoint.searchParams.set('cx', cx)
    endpoint.searchParams.set('q', searchQuery)
    endpoint.searchParams.set('num', '10')

    console.log(`\n🔍 Checking: ${url}`)
    console.log(`   Query: ${searchQuery}`)

    const res = await fetch(endpoint.toString())

    if (!res.ok) {
      const errorText = await res.text()
      console.log(`   ❌ API Error: ${res.status}`)
      return { status: 'ERROR', reason: `API error: ${res.status}` }
    }

    const data = await res.json()
    const items = data.items || []

    console.log(`   📊 Results found: ${items.length}`)

    if (items.length === 0) {
      console.log('   ❌ NOT INDEXED: No results found')
      return { status: 'NOT_INDEXED', reason: 'No results found in Google index' }
    }

    // Normalize URL for comparison
    const normalizeForComparison = (urlStr) => {
      try {
        const u = new URL(urlStr)
        let normalized = u.hostname.replace(/^www\./, '') + u.pathname + u.search
        if (normalized.endsWith('/') && normalized.length > 1) {
          normalized = normalized.slice(0, -1)
        }
        return normalized.toLowerCase()
      } catch {
        return urlStr.replace(/\/$/, '').toLowerCase()
      }
    }

    const targetNormalized = normalizeForComparison(url)
    console.log(`   🎯 Target normalized: ${targetNormalized}`)

    // Look for matching URL
    const match = items.find((item) => {
      if (!item?.link) return false
      const itemNormalized = normalizeForComparison(item.link)
      console.log(`      - Comparing: ${itemNormalized}`)
      return itemNormalized === targetNormalized
    })

    if (match) {
      console.log(`   ✅ INDEXED: ${match.title}`)
      return { 
        status: 'INDEXED', 
        title: match.title,
        snippet: match.snippet
      }
    }

    console.log(`   ❌ NOT INDEXED: URL not found in results`)
    console.log(`      First result was: ${items[0]?.link}`)
    return { 
      status: 'NOT_INDEXED', 
      reason: `URL not found. Google returned: ${items[0]?.link || 'no results'}`
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
    return { status: 'ERROR', reason: error.message }
  }
}

async function main() {
  console.log('🧪 Testing Fixed Google Index Checker\n')
  console.log('=' .repeat(80))

  try {
    // Get user and settings
    const user = await prisma.user.findFirst({
      where: { email: 'admin@epsol.local' },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const settings = await prisma.setting.findUnique({
      where: { userId: user.id },
    })

    if (!settings || !settings.googleKey || !settings.googleCx) {
      throw new Error('Google API credentials not found')
    }

    // Decrypt credentials
    const googleKey = decrypt(settings.googleKey)
    const googleCx = decrypt(settings.googleCx)

    console.log('✅ Credentials loaded\n')

    // Test URLs
    const testUrls = [
      'https://epsoldev.com/blog',
      'https://epsoldev.com/blog/custom-software-vs-off-the-shelf-solutions-which-is-best-for-your-business-in-2025',
      'https://epsoldev.com/blog/how-to-host-n8n-on-hostinger-full-installation-setup-guide-2025',
    ]

    for (const url of testUrls) {
      await checkIndexExact(url, googleKey, googleCx)
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ Test complete!')
  } catch (error) {
    console.error('❌ Error:', error)
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
