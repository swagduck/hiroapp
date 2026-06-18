import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    const sessions = await prisma.session.findMany({
      where: all ? undefined : { status: { in: ["ACTIVE", "PENDING"] } },
      include: {
        package: true,
        orders: true,
        user: true // Thêm user để hiển thị tên khách
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
    const { packageId, orderItems, orderTotal, paymentStatus = "PAID" } = body;

    // Sinh mã ngẫu nhiên 5 ký tự (Ví dụ: A9B21)
    const accessCode = Math.random().toString(36).substring(2, 7).toUpperCase();

    let session;
    
    // Fetch package to get the price for totalAmount calculation
    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    const pkgPrice = pkg?.price || 0;
    const totalAmount = pkgPrice + (orderTotal || 0);

    if (orderItems && orderItems.length > 0) {
      // Dùng transaction để đảm bảo tạo Phiên và Đơn hàng thành công cùng lúc
      session = await prisma.$transaction(async (tx) => {
        const newSession = await tx.session.create({
          data: {
            packageId,
            accessCode,
            startTime: new Date(),
            status: "ACTIVE", // Đã chốt payment status thì active luôn
            paymentStatus: paymentStatus,
            totalAmount,
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
          status: "ACTIVE", // Đã chốt payment status thì active luôn
          paymentStatus: paymentStatus,
          totalAmount
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
