import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies?.get("token")?.value || request.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyJwtToken(token);
    if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = session.userId;
    const fetchAll = searchParams.get('all') === 'true'; // for Admin

    const shifts = await prisma.shift.findMany({
      where: { isActive: true },
      orderBy: { startTime: 'asc' }
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const shiftRecords = await prisma.shiftRecord.findMany({
      where: {
        ...(fetchAll && session.role === "ADMIN" ? {} : { userId }),
        checkIn: { gte: startOfDay }
      },
      include: {
        shift: true,
        user: { select: { name: true, phone: true } }
      },
      orderBy: { checkIn: 'desc' }
    });

    return NextResponse.json({ shifts, records: shiftRecords });
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return NextResponse.json({ error: "Lỗi tải ca làm việc" }, { status: 500 });
  }
}
