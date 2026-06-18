import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const isVercelCron = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isClientCron = request.headers.get('x-client-cron') === 'true';

    if (!isVercelCron && !isClientCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Tìm tất cả các phiên đang hoạt động có giới hạn thời gian (có package duration hoặc dùng giờ bảo lưu)
    const activeSessions = await prisma.session.findMany({
      where: {
        status: "ACTIVE"
      },
      include: {
        package: true
      }
    });

    const now = new Date().getTime();
    let endedCount = 0;

    for (const session of activeSessions) {
      let baseDuration = session.savedMinutesUsed || session.package?.duration;
      const duration = baseDuration ? baseDuration + (session.extraMinutes || 0) : null;
      
      // Nếu có giới hạn thời gian
      if (duration) {
        const expireTime = new Date(session.startTime!).getTime() + duration * 60000;
        
        // Nếu đã hết giờ
        if (expireTime <= now) {
          await prisma.session.update({
            where: { id: session.id },
            data: {
              status: "COMPLETED",
              endTime: new Date(expireTime) // Set endTime là đúng lúc hết giờ, hoặc Date.now()
            }
          });
          endedCount++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Đã dọn dẹp ${endedCount} phiên hết giờ.`
    });

  } catch (error) {
    console.error("Cron Error (Auto-end sessions):", error);
    return NextResponse.json({ error: "Lỗi dọn dẹp phiên" }, { status: 500 });
  }
}
