import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const dateQuery = url.searchParams.get("date"); // yyyy-mm-dd
    
    // Default to today if no date is provided
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (dateQuery) {
      startDate = new Date(dateQuery);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(dateQuery);
      endDate.setHours(23, 59, 59, 999);
    }

    // 1. Package Revenue
    // Dựa trên StartTime của Session (hoặc createdAt)
    const sessions = await prisma.session.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate,
        }
      },
      include: {
        package: true
      }
    });

    const activeSessions = sessions.filter(s => s.status === "ACTIVE").length;
    const completedSessions = sessions.filter(s => s.status === "COMPLETED").length;
    
    const packageRevenue = sessions.reduce((acc, session) => {
      return acc + (session.package?.price || 0);
    }, 0);

    // 2. Orders Revenue
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        // Chỉ tính những order không bị hủy
        status: {
          not: "CANCELLED"
        }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    const orderRevenue = orders.reduce((acc, order) => {
      return acc + order.totalAmount;
    }, 0);

    // 3. Top-selling Drinks
    const drinkCounts: Record<string, { name: string, quantity: number, revenue: number }> = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        // Skip free drinks in combo if price is 0
        // (Wait, items table stores the price. If it's 0, it was free)
        if (drinkCounts[item.menuItemId]) {
          drinkCounts[item.menuItemId].quantity += item.quantity;
          drinkCounts[item.menuItemId].revenue += item.price * item.quantity;
        } else {
          drinkCounts[item.menuItemId] = {
            name: item.menuItem.name,
            quantity: item.quantity,
            revenue: item.price * item.quantity
          };
        }
      });
    });

    const topDrinks = Object.values(drinkCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // Top 5

    const isToday = startDate.toDateString() === new Date().toDateString();
    
    return NextResponse.json({
      date: startDate.toISOString().split('T')[0],
      metrics: {
        totalRevenue: packageRevenue + orderRevenue,
        packageRevenue,
        orderRevenue,
        activeSessions,
        completedSessions,
        totalOrders: orders.length
      },
      topDrinks
    }, {
      headers: {
        'Cache-Control': isToday 
          ? 's-maxage=60, stale-while-revalidate' 
          : 's-maxage=86400, stale-while-revalidate'
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Lỗi lấy dữ liệu báo cáo" }, { status: 500 });
  }
}
