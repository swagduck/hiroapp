import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const verifiedToken = await verifyJwtToken(token).catch(() => null);
    if (!verifiedToken || verifiedToken.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Prevent changing your own role
    if (verifiedToken.userId === id) {
      return NextResponse.json({ error: "Không thể tự đổi quyền của bản thân" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: body.role }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
