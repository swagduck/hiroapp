import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { email: true, points: true, name: true } });
  console.log("USERS:", users);

  const sessions = await prisma.session.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      orders: true,
      user: true
    }
  });

  for (const s of sessions) {
    console.log(`Session ${s.id} (User: ${s.user?.email || 'Guest'}) - Status: ${s.status}`);
    for (const o of s.orders) {
      console.log(`  Order ${o.id} - Status: ${o.status} - Total: ${o.totalAmount} - isExt: ${o.isExtension}`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
