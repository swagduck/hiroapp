import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies?.get("token")?.value || request.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyJwtToken(token);
    if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || "1");
    const limit = parseInt(searchParams.get('limit') || "50");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (category) where.category = category;

    const [transactions, total, summary] = await Promise.all([
      prisma.cashTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { user: { select: { name: true, phone: true } } }
      }),
      prisma.cashTransaction.count({ where }),
      prisma.cashTransaction.groupBy({
        by: ['type'],
        where,
        _sum: { amount: true }
      })
    ]);

    const totalIn = summary.find(s => s.type === "IN")?._sum.amount || 0;
    const totalOut = summary.find(s => s.type === "OUT")?._sum.amount || 0;
    const netProfit = totalIn - totalOut;

    return NextResponse.json({
      data: transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary: { totalIn, totalOut, netProfit }
    });
  } catch (error) {
    console.error("Error fetching cashbook:", error);
    return NextResponse.json({ error: "Lỗi tải sổ quỹ" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies?.get("token")?.value || request.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyJwtToken(token);
    if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, amount, category, description } = body;

    if (!type || !amount || !category) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    const transaction = await prisma.cashTransaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        category,
        description,
        userId: session.id
      }
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating cash transaction:", error);
    return NextResponse.json({ error: "Lỗi tạo phiếu thu/chi" }, { status: 500 });
  }
}
