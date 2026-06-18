import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionCode: string }> }
) {
  try {
    const { sessionCode } = await params;
    const { packageId } = await request.json();
    if (!packageId) return NextResponse.json({ error: "Missing packageId" }, { status: 400 });

    const session = await prisma.session.findUnique({
      where: { accessCode: sessionCode }
    });

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          sessionId: session.id,
          userId: session.userId,
          status: "PENDING",
          totalAmount: pkg.price,
          isExtension: true,
          extensionPackageId: pkg.id,
        }
      });

      await tx.session.update({
        where: { id: session.id },
        data: { totalAmount: { increment: pkg.price } }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
