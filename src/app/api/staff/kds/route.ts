import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies?.get("token")?.value || request.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyJwtToken(token);
    if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch active orders (PENDING or PREPARING)
    // Actually, we want to fetch orders that have at least one PENDING or PREPARING item.
    // Or just fetch all orders created in the last 24 hours that are not cancelled.
    const startOfDay = new Date();
    startOfDay.setHours(startOfDay.getHours() - 24);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay },
        status: { in: ["PENDING", "PREPARING"] }
      },
      include: {
        session: {
          include: { user: true }
        },
        user: true, // For non-session orders
        items: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching KDS orders:", error);
    return NextResponse.json({ error: "Lỗi tải dữ liệu KDS" }, { status: 500 });
  }
}
