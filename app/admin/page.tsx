"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  MemberDetailResponse,
  MemberDetailResponseWrapper,
} from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 관리자 대시보드
 * 이 페이지는 admin/layout.tsx 레이아웃 안에서 렌더링됩니다.
 */
export default function AdminDashboardPage() {
  const router = useRouter();
  const [memberData, setMemberData] = useState<MemberDetailResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMemberData();
  }, []);

  const fetchMemberData = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

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
          router.push("/login");
          return;
        }
        router.push("/");
        return;
      }

      const data: MemberDetailResponseWrapper = await response.json();
      const isSuccess = data.isSuccess || (data as any).success;
      if (isSuccess && data.result) {
        setMemberData(data.result);
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Failed to fetch member data:", err);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
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
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy mb-2">관리자 대시보드</h1>
        <p className="text-gray-text">
          {memberData?.name}님, 관리자 페이지에 오신 것을 환영합니다.
        </p>
      </div>

      {/* Admin Menu Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 대회 관리 */}
        <Link
          href="/admin/tournaments"
          className="card p-6 hover:shadow-card-lg transition-shadow"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-navy rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-navy">대회 관리</h3>
              <p className="text-sm text-gray-text">대회 목록 조회 및 생성</p>
            </div>
          </div>
          <div className="flex items-center text-navy text-sm">
            <span>관리하기</span>
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>

        {/* 회원 관리 */}
        <Link
          href="/admin/members"
          className="card p-6 hover:shadow-card-lg transition-shadow"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-navy rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-navy">회원 관리</h3>
              <p className="text-sm text-gray-text">회원 목록 조회 및 관리</p>
            </div>
          </div>
          <div className="flex items-center text-navy text-sm">
            <span>관리하기</span>
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>

        {/* 출석 관리 */}
        <Link
          href="/admin/attendance"
          className="card p-6 hover:shadow-card-lg transition-shadow"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-navy rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-navy">출석 관리</h3>
              <p className="text-sm text-gray-text">출석 코드 생성 및 관리</p>
            </div>
          </div>
          <div className="flex items-center text-navy text-sm">
            <span>관리하기</span>
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>

        {/* 기초 설정 */}
        <Link
          href="/admin/settings"
          className="card p-6 hover:shadow-card-lg transition-shadow"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-navy rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-navy">기초 설정</h3>
              <p className="text-sm text-gray-text">부서, 직책, 기수 관리</p>
            </div>
          </div>
          <div className="flex items-center text-navy text-sm">
            <span>관리하기</span>
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>

        {/* 상대팀 관리 */}
        <Link
          href="/admin/opponent-schools"
          className="card p-6 hover:shadow-card-lg transition-shadow"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-navy rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏫</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-navy">상대팀 관리</h3>
              <p className="text-sm text-gray-text">상대 학교 및 팀 관리</p>
            </div>
          </div>
          <div className="flex items-center text-navy text-sm">
            <span>관리하기</span>
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}

