const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: { status: 'PENDING' },
    include: { items: true }
  });
  console.dir(orders, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
