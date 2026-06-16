import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    const sessions = await prisma.session.findMany({
      where: all ? undefined : { status: "ACTIVE" },
      include: {
        package: true,
        orders: true
      },
      orderBy: { startTime: 'desc' }
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách phiên hoạt động" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { packageId, orderItems, orderTotal } = body;

    // Sinh mã ngẫu nhiên 5 ký tự (Ví dụ: A9B21)
    const accessCode = Math.random().toString(36).substring(2, 7).toUpperCase();

    let session;

    if (orderItems && orderItems.length > 0) {
      // Dùng transaction để đảm bảo tạo Phiên và Đơn hàng thành công cùng lúc
      session = await prisma.$transaction(async (tx) => {
        const newSession = await tx.session.create({
          data: {
            packageId,
            accessCode,
            startTime: new Date(),
            status: "ACTIVE",
            freeDrinkClaimed: true // Đã lấy ly nước ngay tại quầy
          },
          include: {
            package: true
          }
        });

        await tx.order.create({
          data: {
            sessionId: newSession.id,
            status: "PENDING", // Đang chờ pha chế
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

        return newSession;
      });
    } else {
      // Nếu chỉ tạo phiên đơn thuần
      session = await prisma.session.create({
        data: {
          packageId,
          accessCode,
          startTime: new Date(),
          status: "ACTIVE"
        },
        include: {
          package: true
        }
      });
    }

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Lỗi tạo phiên mới" }, { status: 500 });
  }
}
