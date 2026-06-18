import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verifiedToken = await verifyJwtToken(token).catch(() => null);

    if (!verifiedToken || !verifiedToken.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { id: verifiedToken.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        customerCode: true,
        savedMinutes: true,
        dob: true,
        points: true,
        freeDrinkTokens: true,
        lastBirthdayClaimYear: true,
        tokenVersion: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // CHECK TOKEN VERSION (LAST LOGIN WINS)
    if (user.tokenVersion !== verifiedToken.tokenVersion) {
      const response = NextResponse.json({ error: "Phiên đăng nhập đã hết hạn hoặc tài khoản đang được đăng nhập ở thiết bị khác." }, { status: 401 });
      response.cookies.delete("auth_token");
      return response;
    }

    // Birthday Logic Check
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (user.dob) {
      // Expecting DD/MM/YYYY format
      const parts = user.dob.split("/");
      if (parts.length === 3) {
        const birthMonth = parseInt(parts[1], 10);
        
        // If it's birth month and hasn't claimed this year
        if (birthMonth === currentMonth && user.lastBirthdayClaimYear !== currentYear) {
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
              freeDrinkTokens: { increment: 1 },
              lastBirthdayClaimYear: currentYear
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              customerCode: true,
              savedMinutes: true,
              dob: true,
              points: true,
              freeDrinkTokens: true,
              lastBirthdayClaimYear: true,
              tokenVersion: true
            }
          });
          user = updatedUser;
        }
      }
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const verifiedToken = await verifyJwtToken(token).catch(() => null);
    if (!verifiedToken || !verifiedToken.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { dob } = await request.json();

    const user = await prisma.user.findUnique({ where: { id: verifiedToken.userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // CHECK TOKEN VERSION (LAST LOGIN WINS)
    if (user.tokenVersion !== verifiedToken.tokenVersion) {
      const response = NextResponse.json({ error: "Phiên đăng nhập đã hết hạn hoặc tài khoản đang được đăng nhập ở thiết bị khác." }, { status: 401 });
      response.cookies.delete("auth_token");
      return response;
    }

    if (user.dob && dob !== user.dob) {
      return NextResponse.json({ error: "Bạn đã cập nhật ngày sinh rồi. Vui lòng liên hệ nhân viên nếu muốn thay đổi." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { dob: dob || null },
      select: {
        id: true, name: true, email: true, role: true, customerCode: true,
        savedMinutes: true, dob: true, points: true, freeDrinkTokens: true, lastBirthdayClaimYear: true
      }
    });

    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Auth Me Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
