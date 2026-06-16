import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { isAvailable: true },
    });
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách đồ uống" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, price, imageUrl, categoryId } = body;

    const newMenuItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        categoryId,
      }
    });

    return NextResponse.json(newMenuItem, { status: 201 });
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json({ error: "Lỗi tạo món mới" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, action, ...data } = body;

    if (!id) return NextResponse.json({ error: "Thiếu ID món" }, { status: 400 });

    if (action === "delete") {
      const deleted = await prisma.menuItem.update({
        where: { id },
        data: { isAvailable: false }
      });
      return NextResponse.json(deleted);
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...data,
        ...(data.price ? { price: parseFloat(data.price) } : {})
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json({ error: "Lỗi cập nhật món" }, { status: 500 });
  }
}
