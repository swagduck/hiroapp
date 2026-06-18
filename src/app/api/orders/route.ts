import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { config as zaloConfig, createMac } from "@/lib/zalopay";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: { isExtension: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        session: true
      }
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Lỗi tải danh sách đơn" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, items, totalAmount, updateFreeDrink } = body;

    const date = new Date();
    const yymmdd = date.getFullYear().toString().substring(2) + 
                  ('0' + (date.getMonth() + 1)).slice(-2) + 
                  ('0' + date.getDate()).slice(-2);
    const transId = `${yymmdd}_${Math.floor(Math.random() * 1000000)}`;

    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          sessionId,
          totalAmount,
          status: "PENDING",
          paymentStatus: "UNPAID",
          transId,
          items: {
            create: items.map((item: any) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: {
          items: true,
          session: true
        }
      });

      if (updateFreeDrink) {
        await tx.session.update({
          where: { id: sessionId },
          data: { 
            freeDrinkClaimed: true,
            totalAmount: { increment: totalAmount }
          }
        });
      } else {
        await tx.session.update({
          where: { id: sessionId },
          data: { 
            totalAmount: { increment: totalAmount }
          }
        });
      }

      return order;
    });

    if (totalAmount > 0) {
      // Call ZaloPay Gateway
      const host = request.headers.get("host");
      const protocol = host?.includes("localhost") ? "http" : "https";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
      
      const embed_data = JSON.stringify({ redirecturl: `${appUrl}/customer/${newOrder.session?.accessCode}?payment=order` });
      const orderItems = JSON.stringify([{ id: newOrder.id, name: "Thanh toán Order Cafe" }]);
      const amount = totalAmount;
      const description = `Thanh toán đơn món #${transId}`;
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
        return NextResponse.json({ ...newOrder, orderurl: zaloData.order_url }, { status: 201 });
      } else {
        console.error("ZaloPay order error:", zaloData);
      }
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Lỗi tạo đơn hàng" }, { status: 500 });
  }
}
