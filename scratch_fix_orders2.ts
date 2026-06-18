import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['PREPARING', 'SERVED', 'CANCELLED'] }
    }
  });
  
  let count = 0;
  for (const o of orders) {
    if (o.paymentStatus !== 'PAID') {
      await prisma.order.update({
        where: { id: o.id },
        data: { paymentStatus: 'PAID' }
      });
      count++;
    }
  }
  
  // also fix PENDING orders that are old
  const oldPending = await prisma.order.findMany({
    where: {
      status: 'PENDING'
    }
  });
  for (const o of oldPending) {
    if (!o.transId) {
      await prisma.order.update({
        where: { id: o.id },
        data: { paymentStatus: 'PAID', status: 'CANCELLED' } // just cancel them
      });
      count++;
    }
  }
  
  console.log(`Updated ${count} old orders`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
