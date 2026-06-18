import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.order.updateMany({
    where: {
      status: { in: ['PREPARING', 'SERVED'] },
      paymentStatus: 'UNPAID'
    },
    data: {
      paymentStatus: 'PAID'
    }
  });
  console.log(`Updated ${updated.count} orders`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
