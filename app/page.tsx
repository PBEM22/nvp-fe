"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { MemberDetailResponse } from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 메인 페이지
 */
export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [memberData, setMemberData] = useState<MemberDetailResponse | null>(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
    
    // 사용자 권한 가져오기
    const rolesStr = localStorage.getItem("userRoles");
    if (rolesStr) {
      try {
        setUserRoles(JSON.parse(rolesStr));
      } catch (e) {
        console.error("Failed to parse userRoles:", e);
      }
    }
    
    // 로그인 상태면 사용자 정보 가져오기
    if (token) {
      fetchUserInfo();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserInfo = async () => {
    setIsLoadingUserInfo(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(getApiEndpoint("/api/v1/members/me"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: any = await response.json();
        const isSuccess = data.isSuccess || data.success;
        if (isSuccess && data.result) {
          setMemberData(data.result);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user info:", err);
    } finally {
      setIsLoadingUserInfo(false);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await fetch(getApiEndpoint("/api/v1/auth/logout"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // localStorage 정리
      localStorage.removeItem("accessToken");
      localStorage.removeItem("memberId");
      localStorage.removeItem("userRoles");
      localStorage.removeItem("userInfo");

      // 메인 페이지로 이동 (새로고침)
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
      // 에러가 있어도 로그아웃 처리
      localStorage.removeItem("accessToken");
      localStorage.removeItem("memberId");
      localStorage.removeItem("userRoles");
      localStorage.removeItem("userInfo");
      // 메인 페이지로 이동 (새로고침)
      window.location.href = "/";
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="NVP 로고"
              width={36}
              height={36}
              className="object-contain"
            />
            <span className="text-lg font-bold text-navy">NVP</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {isLoading ? (
              <div className="w-20 h-7 bg-gray-bg rounded animate-pulse" />
            ) : isAuthenticated ? (
              <>
                {/* 관리자 권한이 있는 경우 관리자 페이지 버튼 표시 */}
                {(userRoles.includes("ROLE_MANAGER") || userRoles.includes("ROLE_ADMIN")) && (
                  <Link
                    href="/admin"
                    className="btn-outline text-center text-sm whitespace-nowrap"
                    style={{ padding: "6px 12px" }}
                  >
                    관리자
                  </Link>
                )}
                <Link
                  href="/mypage"
                  className="text-navy hover:text-navy-700 font-medium text-sm whitespace-nowrap"
                >
                  마이페이지
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-gray-text hover:text-navy font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-navy hover:text-navy-700 font-medium text-sm whitespace-nowrap"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary text-center text-sm whitespace-nowrap"
                  style={{ padding: "6px 12px" }}
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Banner */}
        <div className="mb-12 flex justify-center">
          <div className="relative w-full max-w-4xl" style={{ maxHeight: "400px" }}>
            <Image
              src="/banner.png"
              alt="NVP 배너"
              width={1200}
              height={400}
              className="w-full h-auto object-contain rounded-lg"
              priority
            />
          </div>
        </div>

        {/* Quick Links */}
        {isLoading || isLoadingUserInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-12 bg-gray-bg rounded mb-4" />
                <div className="h-5 bg-gray-bg rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-bg rounded w-full" />
              </div>
            ))}
          </div>
        ) : isAuthenticated ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 일반 사용자 메뉴 (관리자 권한이 있어도 기본적으로 일반 메뉴 표시) */}
            <Link
              href="/tournaments"
              className="card hover:shadow-card-lg transition-shadow"
            >
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-lg font-semibold text-navy mb-2">대회</h3>
              <p className="text-sm text-gray-text">
                대회 정보를 조회할 수 있습니다.
              </p>
            </Link>

            <Link
              href="/mypage/attendance"
              className="card hover:shadow-card-lg transition-shadow"
            >
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-navy mb-2">출석</h3>
              <p className="text-sm text-gray-text">
                출석 코드를 입력하여 출석을 체크할 수 있습니다.
              </p>
            </Link>

            {/* 부서와 직급이 있거나 관리자 권한이 있는 경우 멤버 메뉴 표시 */}
            {((memberData?.assignments && memberData.assignments.length > 0) || 
              (userRoles.includes("ROLE_MANAGER") || userRoles.includes("ROLE_ADMIN"))) && (
              <Link
                href="/members"
                className="card hover:shadow-card-lg transition-shadow"
              >
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-navy mb-2">멤버</h3>
                <p className="text-sm text-gray-text">
                  멤버 정보를 조회할 수 있습니다.
                </p>
              </Link>
            )}

            {/* 관리자 권한이 있는 경우 관리자 페이지 카드 추가 */}
            {(userRoles.includes("ROLE_MANAGER") || userRoles.includes("ROLE_ADMIN")) && (
              <Link
                href="/admin"
                className="card hover:shadow-card-lg transition-shadow"
              >
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-lg font-semibold text-navy mb-2">관리자 페이지</h3>
                <p className="text-sm text-gray-text">
                  대회, 회원, 출석 관리 등 관리자 기능을 이용할 수 있습니다.
                </p>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 비회원 메뉴 - 대회 조회 가능 */}
            <Link
              href="/tournaments"
              className="card hover:shadow-card-lg transition-shadow"
            >
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-lg font-semibold text-navy mb-2">대회</h3>
              <p className="text-sm text-gray-text">
                대회 정보를 조회할 수 있습니다.
              </p>
            </Link>

            {/* 로그인 유도 카드 */}
            <div className="card bg-blue-light border-2 border-navy">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-lg font-semibold text-navy mb-2">로그인</h3>
              <p className="text-sm text-gray-text mb-4">
                로그인하여 더 많은 기능을 이용해보세요.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  className="btn-primary text-center"
                  style={{ width: "100%", padding: "8px 16px" }}
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="btn-outline text-center"
                  style={{ width: "100%", padding: "8px 16px" }}
                >
                  회원가입
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
