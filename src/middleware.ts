import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Các đường dẫn được phép truy cập tự do
  const isPublicPath = 
    path === '/login' || 
    path.startsWith('/api/auth') || 
    path.startsWith('/api/seed') || 
    path.startsWith('/customer') ||
    path.includes('.'); // Bỏ qua file tĩnh

  const token = request.cookies.get('auth_token')?.value;

  // Nếu truy cập trang Đăng nhập nhưng đã có token -> Chuyển về trang chủ
  if (path === '/login' && token) {
    const verifiedToken = await verifyJwtToken(token).catch(() => null);
    if (verifiedToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Nếu truy cập trang cần bảo vệ mà không có token
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Nếu có token, kiểm tra tính hợp lệ
  if (!isPublicPath && token) {
    const verifiedToken = await verifyJwtToken(token).catch(() => null);
    if (!verifiedToken) {
      // Token hết hạn hoặc sai -> Xóa và chuyển về login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
