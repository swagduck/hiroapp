import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: "Thiếu số điện thoại" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { phone }
    });

    if (!user) {
      return NextResponse.json({ savedMinutes: 0 });
    }

    return NextResponse.json({ savedMinutes: user.savedMinutes, name: user.name });
  } catch (error) {
    console.error("Lỗi tra cứu giờ bảo lưu:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi tra cứu" }, { status: 500 });
  }
}
