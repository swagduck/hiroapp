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

    // Update order status to SERVED (meaning paid/done)
    await prisma.order.update({
      where: { id },
      data: { status: "SERVED" }
    });

    // Add extra minutes to session
    const session = await prisma.session.findUnique({ where: { id: order.sessionId } });
    if (session && pkg.duration) {
      await prisma.session.update({
        where: { id: session.id },
        data: { extraMinutes: session.extraMinutes + pkg.duration }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
