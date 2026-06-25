import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        customerCode: null,
        role: "CUSTOMER"
      }
    });

    let count = 0;
    for (const user of users) {
      const code = "KH" + Math.floor(10000 + Math.random() * 90000).toString();
      await prisma.user.update({
        where: { id: user.id },
        data: { customerCode: code }
      });
      count++;
    }

    return NextResponse.json({ success: true, count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
