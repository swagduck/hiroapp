import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Các đường dẫn API được phép truy cập tự do
  const isPublicAPI = 
    path.startsWith('/api/auth') || 
    path.startsWith('/api/seed') || 
    path.startsWith('/api/cron') ||
    (path.startsWith('/api/packages') && request.method === 'GET') ||
    (path.startsWith('/api/menu') && request.method === 'GET') ||
    (path.startsWith('/api/sessions/') && request.method === 'GET') ||
    (path === '/api/orders' && request.method === 'POST');

  const isPublicPage = path === '/login' || path === '/customer' || path.startsWith('/customer/');
  
  // Bỏ qua file tĩnh và public APIs
  if (path.includes('.') || isPublicAPI) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;
  let verifiedToken = null;
  
  if (token) {
    verifiedToken = await verifyJwtToken(token).catch(() => null);
  }

  // Nếu truy cập trang /login hoặc /customer nhưng đã đăng nhập -> Chuyển về đúng Dashboard
  if (path === '/login' || path === '/customer') {
    if (verifiedToken) {
      if (verifiedToken.role === 'ADMIN' || verifiedToken.role === 'STAFF') {
        return NextResponse.redirect(new URL('/', request.url));
      } else if (verifiedToken.role === 'CUSTOMER') {
        return NextResponse.redirect(new URL('/member/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // Nếu chưa đăng nhập và cố truy cập trang bảo vệ
  if (!verifiedToken) {
    if (!isPublicPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // ROLE-BASED ACCESS CONTROL (RBAC)
  const role = verifiedToken.role;

  // Trang của Nhân viên / Quản trị
  if (path === '/' || path.startsWith('/staff')) {
    if (role !== 'ADMIN' && role !== 'STAFF') {
      return NextResponse.redirect(new URL('/member/dashboard', request.url));
    }
  }

  // Trang của Khách hàng thành viên
  if (path.startsWith('/member')) {
    if (role !== 'CUSTOMER') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
