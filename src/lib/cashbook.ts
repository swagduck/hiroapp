import { prisma } from "@/lib/prisma";

export async function recordCashTransaction(data: {
  type: "IN" | "OUT";
  amount: number;
  category: string;
  description?: string;
  referenceId?: string;
  userId?: string;
}) {
  if (data.amount <= 0) return null;

  try {
    const transaction = await prisma.cashTransaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description,
        referenceId: data.referenceId,
        userId: data.userId,
      },
    });
    return transaction;
  } catch (error) {
    console.error("Error recording cash transaction:", error);
    return null;
  }
}
