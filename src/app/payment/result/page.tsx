"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const isSuccess = status === "1";

  useEffect(() => {
    // Tự động quay về Dashboard sau 5 giây
    const timeout = setTimeout(() => {
      router.push("/member/dashboard");
    }, 5000);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4">
      <div className="bg-stone-900 border border-white/10 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
        {isSuccess ? (
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        ) : (
          <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </div>
        )}

        <h1 className={`text-2xl font-bold mb-2 ${isSuccess ? "text-emerald-400" : "text-red-400"}`}>
          {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
        </h1>
        <p className="text-stone-400 mb-8">
          {isSuccess 
            ? "Hệ thống đã ghi nhận thanh toán của bạn. Đang tự động quay về trang cá nhân..."
            : "Giao dịch của bạn đã bị huỷ hoặc có lỗi xảy ra. Đang quay về trang cá nhân..."}
        </p>

        <Link href="/member/dashboard" className="inline-block bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-8 rounded-xl transition-colors">
          Quay về ngay
        </Link>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950 flex items-center justify-center"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <PaymentResultContent />
    </Suspense>
  );
}
