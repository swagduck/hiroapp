import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { config as zaloConfig, createMac } from "@/lib/zalopay";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwtToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { packageId } = await request.json();

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return NextResponse.json({ error: "Gói không tồn tại" }, { status: 404 });
    }

    const accessCode = Math.random().toString(36).substring(2, 7).toUpperCase();

    // Generate ZaloPay app_trans_id (Format: yymmdd_xxxxxx)
    const date = new Date();
    const yymmdd = date.getFullYear().toString().substring(2) + 
                  ('0' + (date.getMonth() + 1)).slice(-2) + 
                  ('0' + date.getDate()).slice(-2);
    const transId = `${yymmdd}_${Math.floor(Math.random() * 1000000)}`;

    const session = await prisma.session.create({
      data: {
        userId: payload.userId,
        packageId,
        accessCode,
        transId,
        startTime: new Date(),
        status: "PENDING_PAYMENT",
        paymentStatus: "UNPAID",
        totalAmount: pkg.price,
        freeDrinkClaimed: false
      }
    });

    // Call ZaloPay Gateway
    const embed_data = JSON.stringify({ redirecturl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/result` });
    const items = JSON.stringify([{ id: pkg.id, name: pkg.name }]);
    const amount = pkg.price;
    const description = `Thanh toán gói ${pkg.name}`;
    const app_time = Date.now();
    const app_user = payload.userId;

    const dataForMac = [
      zaloConfig.app_id,
      transId,
      app_user,
      amount,
      app_time,
      embed_data,
      items
    ].join('|');

    const mac = createMac(dataForMac);

    const orderReq = {
      app_id: zaloConfig.app_id,
      app_user,
      app_time,
      amount,
      app_trans_id: transId,
      embed_data,
      item: items,
      description,
      mac,
      bank_code: "" // Mặc định hiển thị tất cả
    };

    const zaloRes = await fetch(zaloConfig.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(orderReq as any).toString()
    });

    const zaloData = await zaloRes.json();

    if (zaloData.return_code === 1) {
      return NextResponse.json({ success: true, orderurl: zaloData.order_url });
    } else {
      console.error("ZaloPay create order error:", zaloData);
      return NextResponse.json({ error: "Lỗi tạo đơn thanh toán ZaloPay" }, { status: 500 });
    }
  } catch (error) {
    console.error("Prebook error:", error);
    return NextResponse.json({ error: "Lỗi tạo phiên đặt chỗ" }, { status: 500 });
  }
}
