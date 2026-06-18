import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ sessionCode: string }> }) {
  try {
    const { sessionCode } = await context.params;
    
    // Tìm session PENDING
    const session = await prisma.session.findUnique({
      where: { id: sessionCode },
      include: { package: true }
    });

    if (!session || session.status !== "PENDING") {
      return NextResponse.json({ error: "Phiên không hợp lệ hoặc đã được duyệt" }, { status: 400 });
    }

    // Points logic: 10,000 VND = 1 point
    // Chỉ tính điểm dựa trên giá gói giờ (không tính tiền nước để tránh cộng 2 lần khi Barista duyệt)
    const priceToPay = session.package.price;
    const earnedPoints = Math.floor(priceToPay / 10000);

    // Cập nhật lại startTime và chuyển sang ACTIVE
    const updatedSession = await prisma.session.update({
      where: { id: sessionCode },
      data: {
        status: "ACTIVE",
        paymentStatus: "PAID",
        startTime: new Date(), // Reset thời gian bắt đầu tính từ lúc Thu Ngân bấm duyệt
      }
    });

    // Cộng điểm cho User nếu có userId
    if (session.userId && earnedPoints > 0) {
      await prisma.user.update({
        where: { id: session.userId },
        data: {
          points: { increment: earnedPoints }
        }
      });
    }

    return NextResponse.json({ success: true, session: updatedSession, earnedPoints });
  } catch (error) {
    console.error("Lỗi duyệt phiên:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
