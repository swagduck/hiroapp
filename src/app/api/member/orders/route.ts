import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("member_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwtToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { packageId, orderItems, orderTotal } = body;

    // Sinh mã truy cập ngẫu nhiên
    const accessCode = Math.random().toString(36).substring(2, 7).toUpperCase();

    // Dùng transaction
    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.session.create({
        data: {
          userId: payload.userId,
          packageId,
          accessCode,
          startTime: new Date(), // Giờ bắt đầu tạm, khi staff duyệt sẽ update lại nếu cần
          status: "PENDING",
          freeDrinkClaimed: false // Chưa duyệt nên chưa được tính là đã lấy
        },
        include: {
          package: true
        }
      });

      if (orderItems && orderItems.length > 0) {
        await tx.order.create({
          data: {
            sessionId: newSession.id,
            status: "PENDING",
            totalAmount: orderTotal,
            items: {
              create: orderItems.map((item: any) => ({
                menuItemId: item.id,
                quantity: item.quantity,
                price: item.price
              }))
            }
          }
        });
      }

      return newSession;
    });

    return NextResponse.json({ success: true, session });

  } catch (error) {
    console.error("Member create order error:", error);
    return NextResponse.json({ error: "Lỗi tạo đơn" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("member_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwtToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Lấy phiên gần nhất của khách
    const sessions = await prisma.session.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      take: 1,
      include: {
        package: true,
        orders: {
          include: { items: { include: { menuItem: true } } }
        }
      }
    });

    return NextResponse.json(sessions[0] || null);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi lấy thông tin" }, { status: 500 });
  }
}
