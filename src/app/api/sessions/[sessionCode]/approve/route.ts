import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ sessionCode: string }> }) {
  try {
    const { sessionCode } = await context.params;
    
    // Tìm session PENDING
    const session = await prisma.session.findUnique({
      where: { id: sessionCode }
    });

    if (!session || session.status !== "PENDING") {
      return NextResponse.json({ error: "Phiên không hợp lệ hoặc đã được duyệt" }, { status: 400 });
    }

    // Cập nhật lại startTime và chuyển sang ACTIVE
    const updatedSession = await prisma.session.update({
      where: { id: sessionCode },
      data: {
        status: "ACTIVE",
        paymentStatus: "PAID",
        startTime: new Date(), // Reset thời gian bắt đầu tính từ lúc Thu Ngân bấm duyệt
      }
    });

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (error) {
    console.error("Lỗi duyệt phiên:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
