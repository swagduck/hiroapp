const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(startOfDay.getHours() - 24);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay },
        status: { in: ["PENDING", "PREPARING"] }
      },
      include: {
        session: {
          include: { user: true }
        },
        user: true,
        items: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.dir(orders, { depth: null });
  } catch(e) {
    console.error(e);
  }
}

main().finally(() => prisma.$disconnect());
