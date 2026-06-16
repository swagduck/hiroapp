import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, items, totalAmount, updateFreeDrink } = body;

    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          sessionId,
          totalAmount,
          status: "PENDING",
          items: {
            create: items.map((item: any) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: {
          items: true
        }
      });

      if (updateFreeDrink) {
        await tx.session.update({
          where: { id: sessionId },
          data: { freeDrinkClaimed: true }
        });
      }

      return order;
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Lỗi tạo đơn hàng" }, { status: 500 });
  }
}
