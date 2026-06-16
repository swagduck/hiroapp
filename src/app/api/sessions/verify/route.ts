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
      return NextResponse.json({ valid: false, message: `Vé đã hết hạn hoặc kết thúc (${session.status})` }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      message: "Vé hợp lệ",
      session
    }, { status: 200 });

  } catch (error) {
    console.error("Lỗi verify vé:", error);
    return NextResponse.json({ valid: false, message: "Lỗi máy chủ" }, { status: 500 });
  }
}
