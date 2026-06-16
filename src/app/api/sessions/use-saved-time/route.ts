import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Function to generate access code (same as in POST /api/sessions)
function generateAccessCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const { phone, minutesToUse } = await request.json();

    if (!phone || !minutesToUse || minutesToUse <= 0) {
      return NextResponse.json({ error: "Thông tin không hợp lệ" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user || user.savedMinutes < minutesToUse) {
      return NextResponse.json({ error: "Số phút bảo lưu không đủ" }, { status: 400 });
    }

    // Generate unique access code
    let accessCode = '';
    let isUnique = false;
    while (!isUnique) {
      accessCode = generateAccessCode();
      const existing = await prisma.session.findUnique({ where: { accessCode } });
      if (!existing) isUnique = true;
    }

    const session = await prisma.$transaction(async (tx) => {
      // Find or create dummy package "Gói Bảo Lưu"
      let packageId = '';
      let dummyPkg = await tx.package.findFirst({
        where: { name: "Gói Bảo Lưu" }
      });
      if (!dummyPkg) {
        dummyPkg = await tx.package.create({
          data: {
            name: "Gói Bảo Lưu",
            price: 0,
            duration: null,
            includesDrink: false,
            isActive: false // Ẩn khỏi bảng giá thông thường
          }
        });
      }
      packageId = dummyPkg.id;

      // Create session
      const newSession = await tx.session.create({
        data: {
          accessCode,
          packageId,
          savedMinutesUsed: minutesToUse,
          userId: user.id
        },
        include: {
          package: true
        }
      });

      // Deduct saved minutes
      await tx.user.update({
        where: { id: user.id },
        data: { savedMinutes: user.savedMinutes - minutesToUse }
      });

      return newSession;
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Lỗi sử dụng giờ bảo lưu:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi tạo phiên" }, { status: 500 });
  }
}
