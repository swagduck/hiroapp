import { NextResponse } from "next/server";
import { verifyCallbackMac } from "@/lib/zalopay";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result: any = {};

    try {
      const { data: dataStr, mac: reqMac } = body;
      const isValid = verifyCallbackMac(dataStr, reqMac);

      if (!isValid) {
        result.return_code = -1;
        result.return_message = "mac not equal";
      } else {
        const dataJson = JSON.parse(dataStr);
        const appTransId = dataJson.app_trans_id;

        // Cập nhật trạng thái Session từ PENDING_PAYMENT sang PRE_BOOKED
        await prisma.session.updateMany({
          where: { transId: appTransId, status: "PENDING_PAYMENT" },
          data: {
            status: "PRE_BOOKED",
            paymentStatus: "PAID"
          }
        });

        result.return_code = 1;
        result.return_message = "success";
      }
    } catch (ex: any) {
      result.return_code = 0;
      result.return_message = ex.message;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("ZaloPay Webhook error:", error);
    return NextResponse.json({ return_code: 0, return_message: "Internal Server Error" });
  }
}
