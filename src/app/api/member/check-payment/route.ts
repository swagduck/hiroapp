import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { config as zaloConfig } from "@/lib/zalopay";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwtToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { transId } = await request.json();
    if (!transId) return NextResponse.json({ error: "Missing transId" }, { status: 400 });

    const session = await prisma.session.findFirst({ where: { transId } });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Nếu đã update qua Webhook rồi thì trả về luôn
    if (session.status !== "PENDING_PAYMENT") {
      return NextResponse.json({ success: true, status: session.status });
    }

    // Nếu vẫn PENDING_PAYMENT, gọi API Truy vấn ZaloPay
    const app_id = zaloConfig.app_id;
    const app_trans_id = transId;
    const dataForMac = `${app_id}|${app_trans_id}|${zaloConfig.key1}`;
    const mac = crypto.createHmac("sha256", zaloConfig.key1).update(dataForMac).digest("hex");

    const queryReq = {
      app_id,
      app_trans_id,
      mac
    };

    const queryRes = await fetch("https://sb-openapi.zalopay.vn/v2/query", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(queryReq as any).toString()
    });

    const queryData = await queryRes.json();

    // return_code: 1 = Thành công, 2 = Thất bại, 3 = Đang xử lý
    if (queryData.return_code === 1) {
      await prisma.session.update({
        where: { id: session.id },
        data: { status: "PRE_BOOKED", paymentStatus: "PAID" }
      });
      return NextResponse.json({ success: true, status: "PRE_BOOKED" });
    } else if (queryData.return_code === 2) {
      // Giao dịch thất bại / bị hủy
      await prisma.session.delete({ where: { id: session.id } });
      return NextResponse.json({ success: true, status: "CANCELLED" });
    } else {
      // Vẫn đang xử lý
      return NextResponse.json({ success: true, status: "PENDING_PAYMENT" });
    }
  } catch (error) {
    console.error("Check payment error:", error);
    return NextResponse.json({ error: "Lỗi kiểm tra thanh toán" }, { status: 500 });
  }
}
