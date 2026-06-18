import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { name: "Uy" } });
  if (user) {
    const deleted = await prisma.session.deleteMany({
      where: {
        userId: user.id,
        status: "PENDING_PAYMENT"
      }
    });
    console.log("Deleted stuck sessions:", deleted.count);
  }
}

main().finally(() => prisma.$disconnect());
