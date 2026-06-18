import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const userId = '6a3141ac8ff97df6a4870342';
  
  let u = await prisma.user.findUnique({ where: { id: userId }});
  console.log("Before:", u?.points);

  u = await prisma.user.update({
    where: { id: userId },
    data: { points: { increment: 3 } }
  });
  console.log("After:", u?.points);
}
main().catch(console.error).finally(() => prisma.$disconnect());
