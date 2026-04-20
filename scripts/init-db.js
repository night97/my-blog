const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function initDatabase() {
    try {
    // 检查是否已存在管理员账号
    const exists = await prisma.user.findUnique({ 
      where: { username: 'admin' } 
    })

    if (!exists) {
      const passwordHash = await bcrypt.hash('admin123', 10)
      await prisma.user.create({ 
        data: { 
          username: 'admin', 
          passwordHash 
        } 
      })
     console.log('Default admin created: username=admin, password=admin123')
    } else {
      console.log('Admin user already exists')
    }
    await prisma.$disconnect()
  } catch (error) {
    console.error('Database initialization failed:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

initDatabase()