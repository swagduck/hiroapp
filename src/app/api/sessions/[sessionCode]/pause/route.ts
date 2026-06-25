import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionCode: string }> }
) {
  try {
    const { phone } = await request.json();
    const { sessionCode } = await context.params;

    if (!sessionCode) {
      return NextResponse.json({ error: "Thiếu ID phiên" }, { status: 400 });
    }

    if (!phone || phone.trim().length < 9) {
      return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionCode },
      include: { package: true }
    });

    if (!session) {
      return NextResponse.json({ error: "Không tìm thấy phiên" }, { status: 404 });
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json({ error: "Phiên đã kết thúc" }, { status: 400 });
    }

    // Tính toán số phút còn lại
    let remainingMinutes = 0;
    
    // Nếu có duration (gói thời gian) hoặc savedMinutesUsed (đang dùng giờ bảo lưu)
    const duration = session.savedMinutesUsed || session.package?.duration;
    
    if (duration) {
      const startTime = new Date(session.startTime).getTime();
      const expireTime = startTime + duration * 60000;
      const now = new Date().getTime();
      
      remainingMinutes = Math.floor((expireTime - now) / 60000);
      
      if (remainingMinutes <= 0) {
        return NextResponse.json({ error: "Phiên đã hết giờ, không thể bảo lưu" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Gói cước không giới hạn thời gian không thể bảo lưu" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Tìm hoặc tạo User với SĐT này
      let user = await tx.user.findFirst({ where: { phone } });
      
      if (user) {
        await tx.user.update({
          where: { id: user.id },
          data: { savedMinutes: user.savedMinutes + remainingMinutes }
        });
      } else {
        user = await tx.user.create({
          data: {
            phone,
            role: "CUSTOMER",
            savedMinutes: remainingMinutes
          }
        });
      }

      // 2. Kết thúc phiên và lưu userId để tracking
      const updatedSession = await tx.session.update({
        where: { id: sessionCode },
        data: { 
          status: "COMPLETED", 
          endTime: new Date(),
          userId: user.id 
        }
      });

      // Trigger real-time update
      await pusherServer.trigger('pos-channel', 'session-update', {});

      return { user, session: updatedSession, savedMinutes: remainingMinutes };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Lỗi bảo lưu giờ:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi bảo lưu giờ" }, { status: 500 });
  }
}
