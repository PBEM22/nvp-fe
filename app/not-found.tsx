"use client";

import Link from "next/link";
import Image from "next/image";

/**
 * 404 Not Found 페이지
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A2B4C] via-[#2A3B5C] to-[#F5F5F5] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 로고 */}
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="NVP Logo"
              width={120}
              height={120}
              className="hover:opacity-80 transition-opacity"
              priority
            />
          </Link>
        </div>

        {/* 404 에러 메시지 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-9xl font-bold text-navy mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-dark mb-2">
            페이지를 찾을 수 없습니다
          </h1>
          <p className="text-gray-text mb-6">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>

          {/* 액션 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="btn-primary px-6 py-3 rounded-lg text-center"
            >
              홈으로 이동
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn-outline px-6 py-3 rounded-lg"
            >
              이전 페이지로
            </button>
          </div>
        </div>

        {/* 도움말 링크들 */}
        <div className="text-center">
          <p className="text-white/80 text-sm mb-2">다른 페이지를 찾아보세요:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/members"
              className="text-white/90 hover:text-white underline transition-colors"
            >
              회원 목록
            </Link>
            <Link
              href="/tournaments"
              className="text-white/90 hover:text-white underline transition-colors"
            >
              대회 목록
            </Link>
            <Link
              href="/matches"
              className="text-white/90 hover:text-white underline transition-colors"
            >
              경기 목록
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

