import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyJwtToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      description, 
      discountType, 
      discountValue, 
      maxDiscount, 
      minOrderValue, 
      validFrom, 
      validUntil, 
      isActive, 
      usageLimit 
    } = body;

    const voucher = await prisma.voucher.update({
      where: { id },
      data: {
        description,
        discountType,
        discountValue: discountValue ? Number(discountValue) : undefined,
        maxDiscount: maxDiscount !== undefined ? (maxDiscount ? Number(maxDiscount) : null) : undefined,
        minOrderValue: minOrderValue !== undefined ? (minOrderValue ? Number(minOrderValue) : null) : undefined,
        validFrom: validFrom !== undefined ? (validFrom ? new Date(validFrom) : null) : undefined,
        validUntil: validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : undefined,
        isActive,
        usageLimit: usageLimit !== undefined ? (usageLimit ? Number(usageLimit) : null) : undefined
      }
    });

    return NextResponse.json(voucher);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi cập nhật mã giảm giá" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyJwtToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Instead of actual delete, we can soft delete or actually delete
    // Check if used
    const usedCount = await prisma.order.count({ where: { voucherId: id } });
    if (usedCount > 0) {
      return NextResponse.json({ error: "Không thể xóa mã đã được sử dụng. Hãy vô hiệu hóa nó." }, { status: 400 });
    }

    await prisma.voucher.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi xóa mã giảm giá" }, { status: 500 });
  }
}
