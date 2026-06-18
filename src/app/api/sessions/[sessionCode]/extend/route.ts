import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { config as zaloConfig, createMac } from "@/lib/zalopay";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionCode: string }> }
) {
  try {
    const { sessionCode } = await params;
    const { packageId } = await request.json();
    if (!packageId) return NextResponse.json({ error: "Missing packageId" }, { status: 400 });

    const session = await prisma.session.findUnique({
      where: { accessCode: sessionCode }
    });

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

    const date = new Date();
    const yymmdd = date.getFullYear().toString().substring(2) + 
                  ('0' + (date.getMonth() + 1)).slice(-2) + 
                  ('0' + date.getDate()).slice(-2);
    const transId = `${yymmdd}_${Math.floor(Math.random() * 1000000)}`;

    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          sessionId: session.id,
          userId: session.userId,
          status: "PENDING",
          paymentStatus: "UNPAID",
          totalAmount: pkg.price,
          isExtension: true,
          extensionPackageId: pkg.id,
          transId
        }
      });

      await tx.session.update({
        where: { id: session.id },
        data: { totalAmount: { increment: pkg.price } }
      });
      
      return order;
    });

    if (pkg.price > 0) {
      // Call ZaloPay Gateway
      const host = request.headers.get("host");
      const protocol = host?.includes("localhost") ? "http" : "https";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
      
      const embed_data = JSON.stringify({ redirecturl: `${appUrl}/customer/${session.accessCode}?payment=extend` });
      const orderItems = JSON.stringify([{ id: newOrder.id, name: `Gia hạn ${pkg.name}` }]);
      const amount = pkg.price;
      const description = `Thanh toán gia hạn #${transId}`;
      const app_time = Date.now();
      const app_user = "guest";

      const dataForMac = [
        zaloConfig.app_id,
        transId,
        app_user,
        amount,
        app_time,
        embed_data,
        orderItems
      ].join('|');

      const mac = createMac(dataForMac);

      const orderReq = {
        app_id: zaloConfig.app_id,
        app_user,
        app_time,
        amount,
        app_trans_id: transId,
        embed_data,
        item: orderItems,
        description,
        callback_url: `${appUrl}/api/webhooks/zalopay`,
        mac,
        bank_code: "" 
      };

      const zaloRes = await fetch(zaloConfig.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(orderReq as any).toString()
      });

      const zaloData = await zaloRes.json();
      if (zaloData.return_code === 1) {
        return NextResponse.json({ success: true, orderurl: zaloData.order_url });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
