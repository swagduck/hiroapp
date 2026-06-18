import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwtToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { packageId } = await request.json();

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return NextResponse.json({ error: "Gói không tồn tại" }, { status: 404 });
    }

    const accessCode = Math.random().toString(36).substring(2, 7).toUpperCase();

    const session = await prisma.session.create({
      data: {
        userId: payload.userId,
        packageId,
        accessCode,
        startTime: new Date(), // Sẽ cập nhật lại khi check-in
        status: "PRE_BOOKED",
        paymentStatus: "PAID", // Giả định khách đã chuyển khoản qua QR
        totalAmount: pkg.price,
        freeDrinkClaimed: false
      }
    });

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("Prebook error:", error);
    return NextResponse.json({ error: "Lỗi tạo phiên đặt chỗ" }, { status: 500 });
  }
}
