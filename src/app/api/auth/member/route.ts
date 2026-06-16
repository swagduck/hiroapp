import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJwtToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, dob } = await request.json();

    if (!name || !dob) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ Họ Tên và Ngày sinh" }, { status: 400 });
    }

    // Tiêu chuẩn hóa chuỗi
    const normalizedName = name.trim().toUpperCase();
    const normalizedDob = dob.trim();

    // Tìm kiếm khách hàng đã tồn tại
    let user = await prisma.user.findFirst({
      where: {
        name: normalizedName,
        dob: normalizedDob,
        role: "CUSTOMER"
      }
    });

    if (!user) {
      // Đăng ký mới nếu chưa có
      // Tạo một mã khách hàng ngẫu nhiên (VD: KH-8392)
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const customerCode = `KH${randomId}`;

      user = await prisma.user.create({
        data: {
          name: normalizedName,
          dob: normalizedDob,
          customerCode,
          role: "CUSTOMER",
        }
      });
    }

    // Tạo JWT token
    const token = await signJwtToken({
      userId: user.id,
      role: user.role,
      name: user.name || undefined,
      customerCode: user.customerCode || undefined
    });

    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        customerCode: user.customerCode,
        savedMinutes: user.savedMinutes
      }
    });

    // Set cookie cho member
    response.cookies.set("member_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;

  } catch (error: any) {
    console.error("Member Auth Error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống", details: error?.message, stack: error?.stack }, { status: 500 });
  }
}
