import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { code, orderTotal } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Vui lòng nhập mã giảm giá" }, { status: 400 });
    }

    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!voucher) {
      return NextResponse.json({ error: "Mã giảm giá không tồn tại" }, { status: 404 });
    }

    if (!voucher.isActive) {
      return NextResponse.json({ error: "Mã giảm giá đã bị khóa" }, { status: 400 });
    }

    const now = new Date();
    if (voucher.validFrom && now < voucher.validFrom) {
      return NextResponse.json({ error: "Mã giảm giá chưa đến ngày có hiệu lực" }, { status: 400 });
    }

    if (voucher.validUntil && now > voucher.validUntil) {
      return NextResponse.json({ error: "Mã giảm giá đã hết hạn" }, { status: 400 });
    }

    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      return NextResponse.json({ error: "Mã giảm giá đã hết lượt sử dụng" }, { status: 400 });
    }

    if (voucher.minOrderValue && orderTotal < voucher.minOrderValue) {
      return NextResponse.json({ error: `Đơn hàng phải từ ${voucher.minOrderValue.toLocaleString('vi-VN')}đ để sử dụng mã này` }, { status: 400 });
    }

    let discountAmount = 0;
    if (voucher.discountType === "PERCENTAGE") {
      discountAmount = orderTotal * (voucher.discountValue / 100);
      if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    } else {
      discountAmount = voucher.discountValue;
    }

    // Không giảm quá tổng tiền đơn hàng
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }

    return NextResponse.json({
      success: true,
      voucherId: voucher.id,
      code: voucher.code,
      discountAmount: Math.floor(discountAmount)
    });

  } catch (error) {
    console.error("Voucher validation error:", error);
    return NextResponse.json({ error: "Lỗi kiểm tra mã giảm giá" }, { status: 500 });
  }
}
