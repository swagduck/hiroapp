import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(sessions.map(s => ({ id: s.id, transId: s.transId, status: s.status, paymentStatus: s.paymentStatus })));
}

main().finally(() => prisma.$disconnect());
