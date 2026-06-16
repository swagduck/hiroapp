import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: "Đã đăng xuất" },
    { status: 200 }
  );

  // Xóa cookie
  response.cookies.delete("auth_token");

  return response;
}
