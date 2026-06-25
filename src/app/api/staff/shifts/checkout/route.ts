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

    const { recordId } = await request.json();
    if (!recordId) return NextResponse.json({ error: "Thiếu mã bản ghi" }, { status: 400 });

    const existingRecord = await prisma.shiftRecord.findUnique({
      where: { id: recordId },
      include: { shift: true }
    });

    if (!existingRecord) return NextResponse.json({ error: "Bản ghi không tồn tại" }, { status: 404 });
    if (existingRecord.status === "COMPLETED") {
      return NextResponse.json({ error: "Ca làm việc này đã được check-out" }, { status: 400 });
    }
    
    // Validate quyền (admin thì đc sửa check-out của người khác, staff thì chỉ của mình)
    if (session.role === "STAFF" && existingRecord.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const checkOutTime = new Date();
    const diffMs = checkOutTime.getTime() - existingRecord.checkIn.getTime();
    const totalHours = diffMs / (1000 * 60 * 60);
    const totalSalary = totalHours * existingRecord.shift.hourlyWage;

    const record = await prisma.shiftRecord.update({
      where: { id: recordId },
      data: {
        checkOut: checkOutTime,
        totalHours: parseFloat(totalHours.toFixed(2)),
        totalSalary: Math.round(totalSalary),
        status: "COMPLETED"
      },
      include: {
        shift: true
      }
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("Error check-out:", error);
    return NextResponse.json({ error: "Lỗi check-out" }, { status: 500 });
  }
}
