import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Basic security: only allow requests with a specific header (like Vercel Cron)
    const isCron = request.headers.get('x-vercel-cron') === '1' || request.headers.get('x-client-cron') === 'true';
    if (!isCron && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine the cutoff date: 1 year ago
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    let archivedCount = 0;

    // 1. Archive Old Sessions
    const oldSessions = await prisma.session.findMany({
      where: {
        createdAt: { lt: oneYearAgo },
        status: { in: ["COMPLETED", "CANCELLED"] } // Only archive finished sessions
      },
      take: 100 // Process in batches
    });

    if (oldSessions.length > 0) {
      await prisma.$transaction(async (tx) => {
        // Create ArchivedRecords
        await tx.archivedRecord.createMany({
          data: oldSessions.map(session => ({
            collection: "Session",
            originalId: session.id,
            data: session as any
          }))
        });

        // Delete from Session
        await tx.session.deleteMany({
          where: { id: { in: oldSessions.map(s => s.id) } }
        });
      });
      archivedCount += oldSessions.length;
    }

    // 2. Archive Old Orders
    const oldOrders = await prisma.order.findMany({
      where: {
        createdAt: { lt: oneYearAgo },
        status: { in: ["SERVED", "CANCELLED"] }
      },
      include: { items: true },
      take: 100
    });

    if (oldOrders.length > 0) {
      await prisma.$transaction(async (tx) => {
        // Delete OrderItems first to satisfy foreign key constraints (though MongoDB Prisma handles it, good practice)
        await tx.orderItem.deleteMany({
          where: { orderId: { in: oldOrders.map(o => o.id) } }
        });

        await tx.archivedRecord.createMany({
          data: oldOrders.map(order => ({
            collection: "Order",
            originalId: order.id,
            data: order as any
          }))
        });

        // Delete from Order
        await tx.order.deleteMany({
          where: { id: { in: oldOrders.map(o => o.id) } }
        });
      });
      archivedCount += oldOrders.length;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Archived ${archivedCount} records older than ${oneYearAgo.toISOString()}` 
    });
  } catch (error) {
    console.error("Archive Cron Error:", error);
    return NextResponse.json({ error: "Lỗi chạy tiến trình lưu trữ" }, { status: 500 });
  }
}
