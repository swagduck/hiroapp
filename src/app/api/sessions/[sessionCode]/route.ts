import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionCode: string }> }
) {
  try {
    const { sessionCode } = await params;
    const session = await prisma.session.findUnique({
      where: { accessCode: sessionCode.toUpperCase() },
      include: {
        package: true,
        orders: {
          include: {
            items: {
              include: {
                menuItem: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: "Không tìm thấy phiên" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Lỗi lấy thông tin phiên" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ sessionCode: string }> }
) {
  try {
    const { sessionCode } = await params;
    const body = await request.json();

    if (body.action === 'end') {
      const updatedSession = await prisma.session.update({
        where: { id: sessionCode }, // Trong page.tsx truyền session.id vào url
        data: {
          status: "COMPLETED",
          endTime: new Date()
        }
      });
      return NextResponse.json(updatedSession);
    }

    if (body.action === 'markPaid') {
      const updatedSession = await prisma.session.update({
        where: { id: sessionCode },
        data: {
          paymentStatus: "PAID"
        }
      });
      return NextResponse.json(updatedSession);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Lỗi cập nhật phiên" }, { status: 500 });
  }
}
