import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      include: {
        recipeItems: {
          include: { ingredient: true }
        }
      }
    });
    return NextResponse.json(menuItems);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi tải công thức" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { menuItemId, items } = body; 
    // items is an array of { ingredientId, quantity }

    await prisma.$transaction(async (tx) => {
      // Delete old recipes
      await tx.recipeItem.deleteMany({
        where: { menuItemId }
      });

      // Create new recipes
      if (items && items.length > 0) {
        await tx.recipeItem.createMany({
          data: items.map((i: any) => ({
            menuItemId,
            ingredientId: i.ingredientId,
            quantity: Number(i.quantity)
          }))
        });
      }
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi cập nhật công thức" }, { status: 500 });
  }
}
