import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies?.get("token")?.value || request.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyJwtToken(token);
    if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { shiftId } = await request.json();
    if (!shiftId) return NextResponse.json({ error: "Thiếu mã ca làm việc" }, { status: 400 });

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) return NextResponse.json({ error: "Ca làm việc không tồn tại" }, { status: 404 });

    // KTra xem đã check-in chưa
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const existingRecord = await prisma.shiftRecord.findFirst({
      where: {
        userId: session.userId,
        shiftId: shiftId,
        checkIn: { gte: startOfDay },
        status: "ACTIVE"
      }
    });

    if (existingRecord) {
      return NextResponse.json({ error: "Bạn đã check-in ca này rồi" }, { status: 400 });
    }

    const record = await prisma.shiftRecord.create({
      data: {
        userId: session.userId,
        shiftId: shiftId,
        checkIn: new Date(),
        status: "ACTIVE"
      },
      include: {
        shift: true
      }
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Error check-in:", error);
    return NextResponse.json({ error: "Lỗi check-in" }, { status: 500 });
  }
}
