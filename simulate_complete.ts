import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orderId = '6a33dc907efa7da5c5246b25'; // Try an already SERVED order, change to PENDING first
  
  await prisma.order.update({ where: { id: orderId }, data: { status: 'PENDING' } });
  
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { session: true }
  });

  console.log("existingOrder:", existingOrder);

  const status = "SERVED";
  if (status === "SERVED" && existingOrder?.status !== "SERVED" && existingOrder?.session?.userId) {
    const earnedPoints = Math.floor(existingOrder.totalAmount / 10000);
    console.log("Earned Points:", earnedPoints);
    if (earnedPoints > 0) {
      const updatedUser = await prisma.user.update({
        where: { id: existingOrder.session.userId },
        data: { points: { increment: earnedPoints } }
      });
      console.log("Updated User:", updatedUser.points);
    }
  } else {
    console.log("Condition not met", {
      statusMatch: status === "SERVED",
      notAlreadyServed: existingOrder?.status !== "SERVED",
      hasUserId: !!existingOrder?.session?.userId
    });
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
