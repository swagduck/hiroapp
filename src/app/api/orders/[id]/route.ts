import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      include: { session: true }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { 
        status,
        ...(status === 'PREPARING' || status === 'SERVED' ? { paymentStatus: "PAID" } : {})
      }
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

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Lỗi cập nhật trạng thái đơn" }, { status: 500 });
  }
}
