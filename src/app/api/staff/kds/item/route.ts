import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyJwtToken(token);
    if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId, status } = await request.json(); // status: PREPARING, SERVED

    if (!itemId || !status) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 1. Update the item status
    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { status }
    });

    // 2. Check if the parent Order needs status update
    // e.g. if any item is PREPARING, order is PREPARING
    // if all items are SERVED, order is SERVED
    const orderId = updatedItem.orderId;
    const allItems = await prisma.orderItem.findMany({
      where: { orderId }
    });

    const allServed = allItems.every(i => i.status === "SERVED" || i.status === "CANCELLED");
    const anyPreparing = allItems.some(i => i.status === "PREPARING");

    let newOrderStatus = null;
    if (allServed) {
      newOrderStatus = "SERVED";
    } else if (anyPreparing) {
      newOrderStatus = "PREPARING";
    }

    if (newOrderStatus) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: newOrderStatus as "SERVED" | "PREPARING" }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating KDS item:", error);
    return NextResponse.json({ error: "Lỗi cập nhật món" }, { status: 500 });
  }
}
