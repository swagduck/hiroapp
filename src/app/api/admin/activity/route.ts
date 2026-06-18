import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Lấy 50 Sessions mới nhất
    const sessions = await prisma.session.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        package: true,
        user: { select: { name: true } }
      }
    });

    // 2. Lấy 50 Orders mới nhất (đã thanh toán / phục vụ)
    const orders = await prisma.order.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        session: { select: { accessCode: true } },
        items: { include: { menuItem: true } }
      }
    });

    // 3. Chuẩn hóa thành Activity format
    const activities: any[] = [];

    sessions.forEach(session => {
      activities.push({
        id: `sess-${session.id}`,
        type: 'SESSION_CREATED',
        accessCode: session.accessCode,
        userName: session.user?.name,
        description: `Mua ${session.package?.name}`,
        amount: session.totalAmount || session.package?.price || 0,
        paymentStatus: session.paymentStatus,
        createdAt: session.createdAt,
        isOvertime: false
      });
      if (session.status === 'COMPLETED') {
        activities.push({
          id: `sess-end-${session.id}`,
          type: 'SESSION_COMPLETED',
          accessCode: session.accessCode,
          userName: session.user?.name,
          description: `Phiên kết thúc`,
          amount: 0,
          paymentStatus: session.paymentStatus,
          createdAt: session.endTime || session.updatedAt,
          isOvertime: false
        });
      }
    });

    orders.forEach(order => {
      if (order.isExtension) {
        activities.push({
          id: `ord-${order.id}`,
          type: 'EXTENSION',
          accessCode: order.session?.accessCode || "N/A",
          description: `Gia hạn thêm giờ`,
          amount: order.totalAmount,
          paymentStatus: order.status === 'SERVED' ? 'PAID' : 'UNPAID',
          createdAt: order.createdAt,
          isOvertime: false
        });
      } else {
        const itemNames = order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ');
        activities.push({
          id: `ord-${order.id}`,
          type: 'DRINK_ORDER',
          accessCode: order.session?.accessCode || "N/A",
          description: `Gọi món: ${itemNames}`,
          amount: order.totalAmount,
          paymentStatus: order.status === 'SERVED' ? 'PAID' : 'UNPAID', // Giả sử served là đã thu tiền
          createdAt: order.createdAt,
          isOvertime: false
        });
      }
    });

    // Sắp xếp giảm dần theo thời gian
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Chỉ lấy 100 hoạt động gần nhất
    return NextResponse.json(activities.slice(0, 100));
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
