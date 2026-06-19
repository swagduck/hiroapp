import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";
import { cookies } from "next/headers";

// List all vouchers
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyJwtToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const vouchers = await prisma.voucher.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(vouchers);
  } catch (error) {
    return NextResponse.json({ error: "Error fetching vouchers" }, { status: 500 });
  }
}

// Create new voucher
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyJwtToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      code, 
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

    if (!code || !discountValue) {
      return NextResponse.json({ error: "Vui lòng nhập mã và mức giảm" }, { status: 400 });
    }

    // Check if code already exists
    const existing = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() }
    });
    if (existing) {
      return NextResponse.json({ error: "Mã giảm giá đã tồn tại" }, { status: 400 });
    }

    const voucher = await prisma.voucher.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType: discountType || "PERCENTAGE",
        discountValue: Number(discountValue),
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        minOrderValue: minOrderValue ? Number(minOrderValue) : null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: isActive !== undefined ? isActive : true,
        usageLimit: usageLimit ? Number(usageLimit) : null
      }
    });

    return NextResponse.json(voucher);
  } catch (error: any) {
    console.error("Voucher creation error:", error);
    return NextResponse.json({ error: error.message || "Lỗi tạo mã giảm giá" }, { status: 500 });
  }
}
