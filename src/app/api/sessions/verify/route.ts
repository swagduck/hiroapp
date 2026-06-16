import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ valid: false, message: "Thiếu mã truy cập" }, { status: 400 });
  }

  try {
    const session = await prisma.session.findUnique({
      where: { accessCode: code.toUpperCase() },
      include: { package: true }
    });

    if (!session) {
      return NextResponse.json({ valid: false, message: "Mã vé không tồn tại!" }, { status: 404 });
    }

    if (session.status !== "ACTIVE") {
      let message = `Vé đã kết thúc hoặc bị hủy.`;
      // Nếu đã kết thúc, tính xem đã kết thúc bao lâu nếu có endTime
      if (session.endTime) {
        const endedAgo = Math.floor((new Date().getTime() - new Date(session.endTime).getTime()) / 60000);
        if (endedAgo > 0) {
          message = `Vé đã kết thúc từ ${endedAgo} phút trước!`;
        }
      }
      return NextResponse.json({ valid: false, message, session }, { status: 400 });
    }

    const duration = session.savedMinutesUsed || session.package?.duration;
    let remainingMinutes = null;

    if (duration) {
      const expireTime = new Date(session.startTime).getTime() + duration * 60000;
      const now = new Date().getTime();
      remainingMinutes = Math.floor((expireTime - now) / 60000);

      if (remainingMinutes <= 0) {
        const overstay = Math.abs(remainingMinutes);
        return NextResponse.json({ 
          valid: false, 
          message: `Đã quá giờ ${overstay} phút!`,
          session,
          overstay
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      valid: true,
      message: remainingMinutes ? `Vé hợp lệ (Còn ${remainingMinutes} phút)` : "Vé hợp lệ (Không giới hạn giờ)",
      session
    }, { status: 200 });

  } catch (error) {
    console.error("Lỗi verify vé:", error);
    return NextResponse.json({ valid: false, message: "Lỗi máy chủ" }, { status: 500 });
  }
}
