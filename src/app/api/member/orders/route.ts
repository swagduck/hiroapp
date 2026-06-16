import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwtToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { packageId, orderItems, orderTotal, updateFreeDrink } = body;

    // Sinh mã truy cập ngẫu nhiên
    const accessCode = Math.random().toString(36).substring(2, 7).toUpperCase();

    // Dùng transaction
    const session = await prisma.$transaction(async (tx) => {
      // Fetch package to get the price
      const pkg = await tx.package.findUnique({ where: { id: packageId } });
      const pkgPrice = pkg?.price || 0;
      const totalAmount = pkgPrice + (orderTotal || 0);
      
      const claimed = (pkg?.includesDrink || updateFreeDrink) ? true : false;

      const newSession = await tx.session.create({
        data: {
          userId: payload.userId,
          packageId,
          accessCode,
          startTime: new Date(), // Giờ bắt đầu tạm, khi staff duyệt sẽ update lại nếu cần
          status: "PENDING",
          paymentStatus: "UNPAID",
          totalAmount,
          freeDrinkClaimed: claimed // Đánh dấu đã dùng quyền lợi ly nước
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

      if (updateFreeDrink) {
        await tx.user.update({
          where: { id: payload.userId },
          data: { freeDrinkTokens: { decrement: 1 } }
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
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwtToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const url = new URL(request.url);
    const history = url.searchParams.get("history") === "true";

    if (history) {
      const allSessions = await prisma.session.findMany({
        where: { userId: payload.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          package: true,
          orders: {
            include: { items: { include: { menuItem: true } } }
          }
        }
      });
      return NextResponse.json(allSessions);
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
