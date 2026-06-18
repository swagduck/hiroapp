import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { name: "Uy" }
  });
  console.log("User tokenVersion:", user?.tokenVersion);
}

main().finally(() => prisma.$disconnect());
