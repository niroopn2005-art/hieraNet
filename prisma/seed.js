const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Create test patients
  try {
    await prisma.patient.deleteMany({}) // Clear existing records first
    
    await prisma.patient.create({
      data: {
        id: 'patient1',
        password: 'patient1@123'
      }
    })

    await prisma.patient.create({
      data: {
        id: 'patient2',
        password: 'patient2@123'
      }
    })

    console.log('Database seeded!')
  } catch (error) {
    console.error('Error seeding database:', error)
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