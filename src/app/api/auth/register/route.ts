import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signJwtToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin (Email, Tên, Mật khẩu)" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã được sử dụng" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "CUSTOMER",
      },
    });

    // Đăng ký thành công, tự động đăng nhập và tạo JWT
    const token = await signJwtToken({
      userId: user.id,
      role: user.role,
    });

    const response = NextResponse.json(
      { success: true, message: "Đăng ký thành công", role: user.role },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 ngày cho member
    });

    return response;
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra" },
      { status: 500 }
    );
  }
}
