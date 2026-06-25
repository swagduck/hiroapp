import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const page = parseInt(searchParams.get('page') || "1");
    const limit = parseInt(searchParams.get('limit') || "50");
    const skip = (page - 1) * limit;

    const whereClause: any = all ? undefined : { status: { in: ["ACTIVE", "PENDING"] } };

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where: whereClause,
        include: {
          package: true,
          orders: true,
          user: true
        },
        orderBy: { startTime: 'desc' },
        ...(searchParams.has('page') ? { skip, take: limit } : {})
      }),
      prisma.session.count({ where: whereClause })
    ]);

    if (searchParams.has('page')) {
      return NextResponse.json({ data: sessions, total, page, totalPages: Math.ceil(total / limit) });
    }

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

        if (paymentStatus === "PAID") {
          await tx.cashTransaction.create({
            data: {
              type: "IN",
              amount: totalAmount,
              category: "BÁN_HÀNG",
              description: `Khách mở phiên ${accessCode} (Gói + Nước)`,
              referenceId: newSession.id
            }
          });
        }

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

      if (paymentStatus === "PAID") {
        await prisma.cashTransaction.create({
          data: {
            type: "IN",
            amount: totalAmount,
            category: "BÁN_HÀNG",
            description: `Khách mở phiên ${accessCode} (Chỉ Gói)`,
            referenceId: session.id
          }
        });
      }
    }

    // Trigger Pusher for POS
    await pusherServer.trigger('pos-channel', 'session-update', {});
    if (orderItems && orderItems.length > 0) {
      await pusherServer.trigger('orders-channel', 'new-order', {});
      await pusherServer.trigger('pos-channel', 'order-update', {});
    }

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Lỗi tạo phiên mới" }, { status: 500 });
  }
}
