import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyJwtToken(token);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      include: {
        sessions: {
          select: { totalAmount: true }
        },
        orders: {
          where: { isExtension: false, status: "SERVED" },
          select: { totalAmount: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const crmData = customers.map(c => {
      const totalSessionSpend = c.sessions.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const totalOrderSpend = c.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      return {
        id: c.id,
        name: c.name || "Khách Hàng",
        phone: c.phone || "Không rõ",
        dob: c.dob,
        customerCode: c.customerCode,
        points: c.points,
        savedMinutes: c.savedMinutes,
        freeDrinkTokens: c.freeDrinkTokens,
        totalSpent: totalSessionSpend + totalOrderSpend,
        createdAt: c.createdAt
      };
    });

    // Sắp xếp theo tổng chi tiêu giảm dần mặc định
    crmData.sort((a, b) => b.totalSpent - a.totalSpent);

    return NextResponse.json(crmData);
  } catch (error) {
    console.error("CRM fetch error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
