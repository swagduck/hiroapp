import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || !order.isExtension || !order.sessionId) {
      return NextResponse.json({ error: "Invalid extension order" }, { status: 400 });
    }

    if (!order.extensionPackageId) {
      return NextResponse.json({ error: "Missing package info" }, { status: 400 });
    }

    const pkg = await prisma.package.findUnique({ where: { id: order.extensionPackageId } });
    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // Update order status to SERVED (meaning paid/done)
      await tx.order.update({
        where: { id },
        data: { status: "SERVED" }
      });

      // Add extra minutes to session
      const session = await tx.session.findUnique({ where: { id: order.sessionId as string } });
      if (session && pkg.duration) {
        await tx.session.update({
          where: { id: session.id },
          data: { 
            extraMinutes: session.extraMinutes + pkg.duration,
            totalAmount: { increment: pkg.price } 
          }
        });

        // Tích điểm cho gia hạn
        if (session.userId) {
          const earnedPoints = Math.floor(pkg.price / 10000);
          if (earnedPoints > 0) {
            await tx.user.update({
              where: { id: session.userId },
              data: { points: { increment: earnedPoints } }
            });
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
