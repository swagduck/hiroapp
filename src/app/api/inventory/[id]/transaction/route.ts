import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, amountChanged, reason } = body;

    const transaction = await prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({ where: { id } });
      if (!ingredient) throw new Error("Không tìm thấy nguyên liệu");

      let newStock = ingredient.currentStock;
      let finalAmount = Number(amountChanged);

      if (type === "RESTOCK") {
        newStock += finalAmount;
      } else if (type === "CONSUMED" || type === "ADJUSTED") {
        newStock -= finalAmount;
        finalAmount = -finalAmount; // luu thanh so am
      }

      await tx.ingredient.update({
        where: { id },
        data: { currentStock: newStock }
      });

      return tx.inventoryTransaction.create({
        data: {
          ingredientId: id,
          type,
          amountChanged: finalAmount,
          reason
        }
      });
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Lỗi cập nhật tồn kho" }, { status: 500 });
  }
}
