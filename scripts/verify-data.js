const { PrismaClient } = require('@prisma/client')

async function verifyData() {
  console.log('🔍 Checking data in Neon database...\n')

  const prisma = new PrismaClient()

  try {
    // Count records
    const userCount = await prisma.user.count()
    const campaignCount = await prisma.campaign.count()
    const urlCount = await prisma.urlItem.count()
    const settingCount = await prisma.setting.count()

    console.log('📊 Current Data in Neon:')
    console.log(`  Users: ${userCount}`)
    console.log(`  Settings: ${settingCount}`)
    console.log(`  Campaigns: ${campaignCount}`)
    console.log(`  URLs: ${urlCount}`)
    console.log('')

    if (userCount === 0) {
      console.log('❌ Database is EMPTY!')
      console.log('   Data was not transferred successfully.')
      console.log('   Please run the transfer script again.')
    } else {
      console.log('✅ Database has data!')
      
      // Show users
      const users = await prisma.user.findMany()
      console.log('\n👥 Users:')
      users.forEach(user => {
        console.log(`  - ${user.email || 'No email'} (ID: ${user.id})`)
      })

      // Show campaigns
      const campaigns = await prisma.campaign.findMany({
        include: {
          _count: {
            select: { items: true }
          }
        }
      })
      console.log('\n📋 Campaigns:')
      campaigns.forEach(campaign => {
        console.log(`  - ${campaign.name} (${campaign._count.items} URLs)`)
      })
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verifyData()
