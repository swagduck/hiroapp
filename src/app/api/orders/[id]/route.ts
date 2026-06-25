import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { 
        session: true,
        items: {
          include: { menuItem: { include: { recipeItems: true } } }
        }
      }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const wasUnpaid = existingOrder.paymentStatus === "UNPAID";
      const becomesPaid = (status === 'PREPARING' || status === 'SERVED');

      const updated = await tx.order.update({
        where: { id },
        data: { 
          status,
          ...(becomesPaid ? { paymentStatus: "PAID" } : {})
        }
      });

      if (wasUnpaid && becomesPaid && existingOrder.totalAmount > 0) {
        await tx.cashTransaction.create({
          data: {
            type: "IN",
            amount: existingOrder.totalAmount,
            category: "BÁN_HÀNG",
            description: `Thu ngân duyệt đơn hàng món #${existingOrder.id.substring(existingOrder.id.length - 6)}`,
            referenceId: existingOrder.id
          }
        });
      }

      // Nếu trạng thái chuyển thành SERVED, tiến hành trừ kho
      if (status === "SERVED" && existingOrder.status !== "SERVED") {
        for (const item of existingOrder.items) {
          const qty = item.quantity;
          for (const recipe of item.menuItem.recipeItems) {
            const consumed = qty * recipe.quantity;
            await tx.ingredient.update({
              where: { id: recipe.ingredientId },
              data: { currentStock: { decrement: consumed } }
            });
            await tx.inventoryTransaction.create({
              data: {
                ingredientId: recipe.ingredientId,
                type: "CONSUMED",
                amountChanged: -consumed,
                reason: `Đơn hàng #${existingOrder.id}`
              }
            });
          }
        }
      }
      return updated;
    });

    // Add points if served
    if (status === "SERVED" && existingOrder.status !== "SERVED" && existingOrder.session?.userId) {
      const earnedPoints = Math.floor(existingOrder.totalAmount / 10000);
      if (earnedPoints > 0) {
        await prisma.user.update({
          where: { id: existingOrder.session.userId },
          data: { points: { increment: earnedPoints } }
        });
      }
    }

    // Decrement session total if cancelled
    if (status === "CANCELLED" && existingOrder.status !== "CANCELLED" && existingOrder.sessionId) {
      await prisma.session.update({
        where: { id: existingOrder.sessionId },
        data: { totalAmount: { decrement: existingOrder.totalAmount } }
      });
    }

    await pusherServer.trigger('orders-channel', 'order-updated', { orderId: id, status });
    await pusherServer.trigger('pos-channel', 'order-update', {});
    
    if (status === "SERVED") {
      await pusherServer.trigger('pos-channel', 'inventory-update', {});
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Lỗi cập nhật trạng thái đơn" }, { status: 500 });
  }
}
