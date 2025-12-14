"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 관리자 페이지 레이아웃
 * 왼쪽 고정 사이드바 + 오른쪽 메인 콘텐츠 영역
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      // API에서 최신 사용자 정보 가져오기
      const response = await fetch(getApiEndpoint("/api/v1/members/me"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("memberId");
          localStorage.removeItem("userRoles");
          router.push("/login");
          return;
        }
        router.push("/");
        return;
      }

      const data: any = await response.json();
      const isSuccess = data.isSuccess || data.success;
      
      if (isSuccess && data.result) {
        const roles = data.result.roles || [];
        setUserRoles(roles);
        
        // localStorage에도 업데이트
        localStorage.setItem("userRoles", JSON.stringify(roles));

        // 관리자 권한이 없으면 메인 페이지로 리다이렉트
        const hasAdmin = roles.includes("ROLE_MANAGER") || roles.includes("ROLE_ADMIN");
        
        if (!hasAdmin) {
          router.push("/");
          return;
        }
        
        // 권한이 있으면 로딩 종료
        setIsLoading(false);
      } else {
        router.push("/");
        return;
      }
    } catch (err) {
      // localStorage에서 다시 시도
      const rolesStr = localStorage.getItem("userRoles");
      if (rolesStr) {
        try {
          const roles = JSON.parse(rolesStr);
          setUserRoles(roles);
          const hasAdmin = roles.includes("ROLE_MANAGER") || roles.includes("ROLE_ADMIN");
          if (!hasAdmin) {
            router.push("/");
            return;
          }
          setIsLoading(false);
        } catch (e) {
          router.push("/");
          return;
        }
      } else {
        router.push("/");
        return;
      }
    }
  };

  // 관리자 권한 확인
  const hasAdminRole = userRoles.includes("ROLE_MANAGER") || userRoles.includes("ROLE_ADMIN");

  const menuItems = [
    {
      icon: "🏆",
      label: "대회 관리",
      path: "/admin/tournaments",
    },
    {
      icon: "👥",
      label: "회원 관리",
      path: "/admin/members",
    },
    {
      icon: "📋",
      label: "출석 관리",
      path: "/admin/attendance",
    },
    {
      icon: "⚙️",
      label: "기초 설정",
      path: "/admin/settings",
    },
    {
      icon: "🏫",
      label: "상대팀 관리",
      path: "/admin/opponent-schools",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/admin/tournaments") {
      return pathname === "/admin" || pathname === "/admin/tournaments" || pathname.startsWith("/admin/tournaments/");
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // 로딩 중이면 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-light rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
            <svg
              className="w-8 h-8 text-navy"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <p className="text-gray-text">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로딩이 완료되었는데 권한이 없으면 로딩 화면 표시 (리다이렉트 중)
  if (!isLoading && !hasAdminRole) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-text">권한을 확인하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-56 bg-navy-900 text-white
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-3 border-b border-navy-700">
          <h2 className="text-base font-semibold truncate">관리자</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-300 shrink-0"
            aria-label="사이드바 닫기"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      flex items-center gap-2.5 px-3 py-2.5 rounded-lg
                      transition-colors duration-200
                      text-sm
                      ${
                        active
                          ? "bg-navy-700 text-white font-medium"
                          : "text-gray-300 hover:bg-navy-800 hover:text-white"
                      }
                    `}
                    title={item.label}
                  >
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer - 메인으로 나가기 */}
        <div className="border-t border-navy-700 p-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-navy-800 hover:text-white transition-colors duration-200 text-sm"
            title="메인으로 나가기"
          >
            <span className="text-lg shrink-0">🏠</span>
            <span className="truncate">메인으로 나가기</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header with Back Button */}
        <header className="hidden lg:flex bg-white border-b border-gray-border px-6 py-3 items-center gap-4">
          <Link
            href="/"
            className="flex items-center justify-center w-9 h-9 text-navy hover:bg-gray-bg rounded-lg transition-colors shrink-0"
            aria-label="메인으로 돌아가기"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-navy">관리자</h1>
        </header>

        {/* Mobile Header with Hamburger and Back Button */}
        <header className="lg:hidden bg-white border-b border-gray-border px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-navy hover:text-navy-700 shrink-0"
              aria-label="메뉴 열기"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Link
              href="/"
              className="flex items-center justify-center w-8 h-8 text-navy hover:bg-gray-bg rounded-lg transition-colors shrink-0"
              aria-label="메인으로 돌아가기"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
          </div>
          <h1 className="text-sm font-semibold text-navy truncate px-2">관리자</h1>
          <div className="w-13 shrink-0" /> {/* Spacer for centering (8 + 5) */}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}

