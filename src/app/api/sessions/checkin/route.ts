import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { accessCode } = await request.json();

    if (!accessCode) {
      return NextResponse.json({ error: "Thiếu mã truy cập" }, { status: 400 });
    }

    const session = await prisma.session.findFirst({
      where: { accessCode, status: "PRE_BOOKED" }
    });

    if (!session) {
      return NextResponse.json({ error: "Mã không hợp lệ hoặc phiên đã được kích hoạt." }, { status: 404 });
    }

    // Kích hoạt phiên, cập nhật startTime thành thời điểm hiện tại
    await prisma.session.update({
      where: { id: session.id },
      data: {
        status: "ACTIVE",
        startTime: new Date()
      }
    });

    return NextResponse.json({ success: true, message: "Kích hoạt phiên thành công!" });
  } catch (error) {
    console.error("Checkin error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
