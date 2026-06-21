import { NextResponse } from "next/server";
import { verifyRedirectMac } from "@/lib/zalopay";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const isValid = verifyRedirectMac(data);
    return NextResponse.json({ isValid });
  } catch (error) {
    return NextResponse.json({ isValid: false });
  }
}
