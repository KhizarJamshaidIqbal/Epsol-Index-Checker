const { PrismaClient } = require('@prisma/client')

// Local database connection
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/epsol_indexing'
    }
  }
})

// Neon database connection
const neonPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
    }
  }
})

async function transferData() {
  console.log('🚀 Starting data transfer from local PostgreSQL to Neon...\n')

  try {
    // Step 1: Fetch all users from local database
    console.log('📥 Fetching users from local database...')
    const users = await localPrisma.user.findMany({
      include: {
        settings: true,
        campaigns: {
          include: {
            items: true
          }
        }
      }
    })
    console.log(`✅ Found ${users.length} users\n`)

    // Step 2: Transfer each user with their data
    for (const user of users) {
      console.log(`👤 Transferring user: ${user.email || user.id}`)

      // Create user in Neon
      const newUser = await neonPrisma.user.upsert({
        where: { email: user.email || `user-${user.id}@placeholder.com` },
        update: {
          name: user.name,
          emailVerified: user.emailVerified,
          image: user.image,
        },
        create: {
          email: user.email || `user-${user.id}@placeholder.com`,
          name: user.name,
          emailVerified: user.emailVerified,
          image: user.image,
          createdAt: user.createdAt,
        }
      })
      console.log(`  ✅ User transferred`)

      // Transfer settings
      if (user.settings) {
        await neonPrisma.setting.upsert({
          where: { userId: newUser.id },
          update: {
            googleKey: user.settings.googleKey,
            googleCx: user.settings.googleCx,
          },
          create: {
            userId: newUser.id,
            googleKey: user.settings.googleKey,
            googleCx: user.settings.googleCx,
            createdAt: user.settings.createdAt,
          }
        })
        console.log(`  ✅ Settings transferred`)
      }

      // Transfer campaigns with items
      for (const campaign of user.campaigns) {
        console.log(`  📋 Transferring campaign: ${campaign.name}`)
        
        const newCampaign = await neonPrisma.campaign.create({
          data: {
            userId: newUser.id,
            name: campaign.name,
            status: campaign.status,
            createdAt: campaign.createdAt,
            items: {
              create: campaign.items.map(item => ({
                url: item.url,
                status: item.status,
                title: item.title,
                snippet: item.snippet,
                reason: item.reason,
                checkedAt: item.checkedAt,
                createdAt: item.createdAt,
              }))
            }
          }
        })
        console.log(`    ✅ Campaign transferred with ${campaign.items.length} URLs`)
      }

      console.log()
    }

    console.log('✨ Data transfer completed successfully!')
    console.log('\n📊 Summary:')
    
    const neonUsers = await neonPrisma.user.count()
    const neonCampaigns = await neonPrisma.campaign.count()
    const neonItems = await neonPrisma.urlItem.count()
    
    console.log(`  - Users: ${neonUsers}`)
    console.log(`  - Campaigns: ${neonCampaigns}`)
    console.log(`  - URLs: ${neonItems}`)

  } catch (error) {
    console.error('❌ Error during transfer:', error)
    throw error
  } finally {
    await localPrisma.$disconnect()
    await neonPrisma.$disconnect()
  }
}

// Run the transfer
transferData()
  .then(() => {
    console.log('\n🎉 All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Transfer failed:', error)
    process.exit(1)
  })
