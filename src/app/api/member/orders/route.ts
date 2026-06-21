import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { verifyJwtToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { config as zaloConfig, createMac } from "@/lib/zalopay";

export const dynamic = 'force-dynamic';

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

    const body = await request.json();
    const { packageId, orderItems, orderTotal, updateFreeDrink, voucherCode } = body;

    // Sinh mã truy cập ngẫu nhiên
    const accessCode = Math.random().toString(36).substring(2, 7).toUpperCase();

    const date = new Date();
    const yymmdd = date.getFullYear().toString().substring(2) + 
                  ('0' + (date.getMonth() + 1)).slice(-2) + 
                  ('0' + date.getDate()).slice(-2);
    const transId = `${yymmdd}_${Math.floor(Math.random() * 1000000)}`;

    // Dùng transaction
    const txResult = await prisma.$transaction(async (tx) => {
      // Fetch package to get the price
      const pkg = await tx.package.findUnique({ where: { id: packageId } });
      const pkgPrice = pkg?.price || 0;
      
      let baseTotalAmount = orderTotal || pkgPrice;
      let finalDiscountAmount = 0;
      let usedVoucherId = null;

      // Validate Voucher if provided
      if (voucherCode) {
        const voucher = await tx.voucher.findUnique({ where: { code: voucherCode } });
        if (voucher && voucher.isActive) {
          const now = new Date();
          const validFromOk = !voucher.validFrom || now >= voucher.validFrom;
          const validUntilOk = !voucher.validUntil || now <= voucher.validUntil;
          const usageOk = !voucher.usageLimit || voucher.usedCount < voucher.usageLimit;
          const minOrderOk = !voucher.minOrderValue || baseTotalAmount >= voucher.minOrderValue;

          if (validFromOk && validUntilOk && usageOk && minOrderOk) {
            let discount = 0;
            if (voucher.discountType === "PERCENTAGE") {
              discount = baseTotalAmount * (voucher.discountValue / 100);
              if (voucher.maxDiscount && discount > voucher.maxDiscount) {
                discount = voucher.maxDiscount;
              }
            } else {
              discount = voucher.discountValue;
            }
            if (discount > baseTotalAmount) discount = baseTotalAmount;
            
            finalDiscountAmount = Math.floor(discount);
            usedVoucherId = voucher.id;

            // Increment usage
            await tx.voucher.update({
              where: { id: voucher.id },
              data: { usedCount: { increment: 1 } }
            });
          }
        }
      }

      const finalTotalAmount = Math.max(0, baseTotalAmount - finalDiscountAmount);
      const claimed = (pkg?.includesDrink || updateFreeDrink) ? true : false;

      const newSession = await tx.session.create({
        data: {
          userId: payload.userId,
          packageId,
          accessCode,
          startTime: new Date(), 
          status: "PENDING_PAYMENT",
          paymentStatus: "UNPAID",
          totalAmount: finalTotalAmount,
          transId,
          freeDrinkClaimed: claimed,
          voucherId: usedVoucherId,
          discountAmount: finalDiscountAmount
        },
        include: {
          package: true
        }
      });

      let createdOrder = null;
      if (orderItems && orderItems.length > 0) {
        createdOrder = await tx.order.create({
          data: {
            sessionId: newSession.id,
            status: "PENDING",
            totalAmount: Math.max(0, orderTotal - pkgPrice),
            paymentStatus: "UNPAID",
            transId, 
            items: {
              create: orderItems.map((item: any) => ({
                menuItemId: item.id,
                quantity: item.quantity,
                price: item.price
              }))
            }
          },
          include: {
            items: { include: { menuItem: true } },
            session: true
          }
        });
      }

      if (updateFreeDrink) {
        await tx.user.update({
          where: { id: payload.userId },
          data: { freeDrinkTokens: { decrement: 1 } }
        });
      }

      return { newSession, createdOrder };
    });

    const session = txResult.newSession;
    const createdOrder = txResult.createdOrder;

    if (createdOrder) {
      try {
        await pusherServer.trigger('orders-channel', 'new-order', createdOrder);
      } catch (e) {
        console.error("Pusher error:", e);
      }
    }

    if (session.totalAmount && session.totalAmount > 0) {
      // Call ZaloPay Gateway
      const host = request.headers.get("host");
      const protocol = host?.includes("localhost") ? "http" : "https";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
      
      const embed_data = JSON.stringify({ redirecturl: `${appUrl}/member/dashboard` });
      const orderItemsZalo = JSON.stringify([{ id: session.id, name: "Thanh toán Gói và Nước" }]);
      const amount = session.totalAmount;
      const description = `Thanh toán phiên #${transId}`;
      const app_time = Date.now();
      const app_user = "member";

      const dataForMac = [
        zaloConfig.app_id,
        transId,
        app_user,
        amount,
        app_time,
        embed_data,
        orderItemsZalo
      ].join('|');

      const mac = createMac(dataForMac);

      const orderReq = {
        app_id: zaloConfig.app_id,
        app_user,
        app_time,
        amount,
        app_trans_id: transId,
        embed_data,
        item: orderItemsZalo,
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
        return NextResponse.json({ success: true, session, orderurl: zaloData.order_url });
      } else {
        console.error("ZaloPay order error:", zaloData);
      }
    }

    return NextResponse.json({ success: true, session });

  } catch (error) {
    console.error("Member create order error:", error);
    return NextResponse.json({ error: "Lỗi tạo đơn" }, { status: 500 });
  }
}

export async function GET(request: Request) {
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

    const url = new URL(request.url);
    const history = url.searchParams.get("history") === "true";

    if (history) {
      const allSessions = await prisma.session.findMany({
        where: { userId: payload.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          package: true,
          orders: {
            include: { items: { include: { menuItem: true } } }
          }
        }
      });
      return NextResponse.json(allSessions);
    }

    // Lấy phiên gần nhất của khách
    const sessions = await prisma.session.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      take: 1,
      include: {
        package: true,
        orders: {
          include: { items: { include: { menuItem: true } } }
        }
      }
    });

    return NextResponse.json(sessions[0] || null);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi lấy thông tin" }, { status: 500 });
  }
}
