import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(ingredients);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi lấy dữ liệu kho" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, unit, minStock, currentStock } = body;

    const newIngredient = await prisma.ingredient.create({
      data: {
        name,
        unit,
        minStock: Number(minStock) || 0,
        currentStock: Number(currentStock) || 0
      }
    });

    if (newIngredient.currentStock > 0) {
      await prisma.inventoryTransaction.create({
        data: {
          ingredientId: newIngredient.id,
          type: "RESTOCK",
          amountChanged: newIngredient.currentStock,
          reason: "Khởi tạo tồn kho ban đầu"
        }
      });
    }

    return NextResponse.json(newIngredient, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi tạo nguyên liệu" }, { status: 500 });
  }
}
