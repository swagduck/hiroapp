import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { sessions: { include: { orders: true, package: true } } } });

  for (const user of users) {
    let totalPoints = 0;
    for (const session of user.sessions) {
      if (session.status !== 'PENDING') {
        const ppts = Math.floor((session.package?.price || 0) / 10000);
        if (ppts > 0) totalPoints += ppts;
        
        for (const order of session.orders) {
          if (order.status === 'SERVED') {
            const opts = Math.floor((order.totalAmount || 0) / 10000);
            if (opts > 0) totalPoints += opts;
          }
        }
      }
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: { points: totalPoints }
    });
    console.log(`Updated user ${user.email} points to ${totalPoints}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
