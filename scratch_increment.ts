import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  let user = await prisma.user.findFirst({ where: { name: "Uy" } });
  console.log("Before update:", user?.tokenVersion);
  
  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { tokenVersion: { increment: 1 } }
    });
    console.log("After update:", user.tokenVersion);
  }
}

main().finally(() => prisma.$disconnect());
