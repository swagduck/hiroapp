import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyJwtToken(token);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    
    // Allow updating points, savedMinutes, freeDrinkTokens
    const updateData: any = {};
    if (body.points !== undefined) updateData.points = Number(body.points);
    if (body.savedMinutes !== undefined) updateData.savedMinutes = Number(body.savedMinutes);
    if (body.freeDrinkTokens !== undefined) updateData.freeDrinkTokens = Number(body.freeDrinkTokens);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("CRM Update error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
