import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const unpaid = await prisma.order.findMany({
    where: { paymentStatus: 'UNPAID' }
  });
  console.log(`Unpaid orders:`, unpaid.map(u => ({ id: u.id, isExtension: u.isExtension, status: u.status })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
