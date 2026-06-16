import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });
    return NextResponse.json(packages);
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách gói cước" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, price, type, duration } = body;

    const newPackage = await prisma.package.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        type,
        duration: duration ? parseInt(duration) : null,
      }
    });

    return NextResponse.json(newPackage, { status: 201 });
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json({ error: "Lỗi tạo gói cước mới" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, action, ...data } = body;

    if (!id) return NextResponse.json({ error: "Thiếu ID gói" }, { status: 400 });

    if (action === "delete") {
      const deleted = await prisma.package.update({
        where: { id },
        data: { isActive: false }
      });
      return NextResponse.json(deleted);
    }

    const updated = await prisma.package.update({
      where: { id },
      data: {
        ...data,
        ...(data.price ? { price: parseFloat(data.price) } : {}),
        ...(data.duration ? { duration: parseInt(data.duration) } : {})
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json({ error: "Lỗi cập nhật gói" }, { status: 500 });
  }
}
