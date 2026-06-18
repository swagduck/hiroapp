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
        const updateSession = await prisma.session.updateMany({
          where: { transId: appTransId, status: "PENDING_PAYMENT" },
          data: {
            status: "PRE_BOOKED",
            paymentStatus: "PAID"
          }
        });

        // Nếu không có session nào được update, thử tìm trong bảng Order
        if (updateSession.count === 0) {
          const order = await prisma.order.findFirst({ where: { transId: appTransId, paymentStatus: "UNPAID" }});
          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: "PAID",
                // Nếu là đơn gọi nước thì chuyển sang PREPARING (bếp làm)
                // Nếu là đơn gia hạn thì coi như xong (SERVED/COMPLETED) 
                // nhưng OrderStatus không có COMPLETED, ta sẽ dùng PENDING/PREPARING
                // Thực tế nếu isExtension thì chỉ cần paymentStatus = PAID, sau đó cron/logic sẽ cộng giờ.
                status: order.isExtension ? "SERVED" : "PREPARING" 
              }
            });

            // Nếu là gia hạn, cộng giờ vào session
            if (order.isExtension && order.extensionPackageId && order.sessionId) {
              const extPkg = await prisma.package.findUnique({ where: { id: order.extensionPackageId }});
              if (extPkg && extPkg.duration) {
                await prisma.session.update({
                  where: { id: order.sessionId },
                  data: { extraMinutes: { increment: extPkg.duration } }
                });
              }
            }
          }
        }

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
