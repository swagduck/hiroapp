import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // Xoá dữ liệu cũ
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.session.deleteMany();
    await prisma.package.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // 0. Tạo User Admin
    const hashedPassword = await bcrypt.hash("123456", 10);
    await prisma.user.create({
      data: {
        email: "admin@space.com",
        name: "Admin Quản Lý",
        password: hashedPassword,
        role: "ADMIN"
      }
    });

    // Tạo gói cước (Packages)
    await prisma.package.createMany({
      data: [
        { name: "Phiên học ngắn (Không nước)", price: 20000, duration: 120, includesDrink: false },
        { name: "Phiên học dài (Không nước)", price: 30000, duration: 240, includesDrink: false },
        { name: "Combo Học + Nước Cơ Bản", price: 50000, duration: 240, includesDrink: true },
        { name: "Combo Học + Nước Đặc Biệt", price: 55000, duration: 240, includesDrink: true },
        { name: "Combo 3 Tiếng + Nước", price: 65000, duration: 180, includesDrink: true },
      ]
    });

    // Tạo Category và Menu
    const coffeeCategory = await prisma.category.create({ data: { name: "Cà phê" } });
    const teaCategory = await prisma.category.create({ data: { name: "Trà & Trái cây" } });

    await prisma.menuItem.createMany({
      data: [
        { name: "Cà phê Sữa Đá", price: 35000, categoryId: coffeeCategory.id, imageUrl: "☕" },
        { name: "Bạc Xỉu", price: 35000, categoryId: coffeeCategory.id, imageUrl: "☕" },
        { name: "Trà Đào Cam Sả", price: 45000, categoryId: teaCategory.id, imageUrl: "🍹" },
        { name: "Nước Ép Thơm", price: 40000, categoryId: teaCategory.id, imageUrl: "🍍" }
      ]
    });

    return NextResponse.json({ message: "Seed dữ liệu thành công!" });
  } catch (error) {
    console.error("Error seeding data:", error);
    return NextResponse.json({ error: "Lỗi seed dữ liệu" }, { status: 500 });
  }
}
