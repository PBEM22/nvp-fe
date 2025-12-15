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
 * 마이페이지
 */
export default function MyPage() {
  const router = useRouter();
  const [memberData, setMemberData] = useState<MemberDetailResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    fetchMemberData();
  }, []);

  const fetchMemberData = async () => {
    setIsLoading(true);
    setError(null);

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
        throw new Error("회원 정보를 불러오는데 실패했습니다.");
      }

      const data: any = await response.json();
      const isSuccess = data.isSuccess || data.success;
      
      if (isSuccess && data.result) {
        // API 응답에서 male -> isMale, public -> isPublic로 매핑
        const mappedResult = {
          ...data.result,
          isMale: data.result.isMale !== undefined ? data.result.isMale : data.result.male,
          isPublic: data.result.isPublic !== undefined ? data.result.isPublic : data.result.public,
        };
        setMemberData(mappedResult);
      } else {
        throw new Error(data.message || "회원 정보를 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "회원 정보를 불러오는데 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(getApiEndpoint("/api/v1/members/me"), {
        method: "DELETE",
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "회원 탈퇴에 실패했습니다.");
      }

      const result: any = await response.json();
      const isSuccess = result.isSuccess || result.success;

      if (isSuccess) {
        // localStorage 정리
        localStorage.removeItem("accessToken");
        localStorage.removeItem("memberId");
        localStorage.removeItem("userRoles");
        localStorage.removeItem("userInfo");

        // 메인 페이지로 이동
        window.location.href = "/";
      } else {
        throw new Error(result.message || "회원 탈퇴에 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "회원 탈퇴에 실패했습니다."
      );
      setIsWithdrawing(false);
      setShowWithdrawModal(false);
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

      // 메인 페이지로 이동
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
      // 에러가 있어도 로그아웃 처리
      localStorage.removeItem("accessToken");
      localStorage.removeItem("memberId");
      localStorage.removeItem("userRoles");
      localStorage.removeItem("userInfo");
      // 메인 페이지로 이동
      window.location.href = "/";
    }
  };

  // 현재 활동 이력 가져오기 (가장 최근 것)
  const currentAssignment = memberData?.assignments?.[0] || null;

  // assignment를 periodNumber 기준으로 그룹화
  const assignmentsByPeriod = memberData?.assignments?.reduce(
    (acc, assignment) => {
      const periodKey = assignment.periodNumber;
      if (!acc[periodKey]) {
        acc[periodKey] = [];
      }
      acc[periodKey].push(assignment);
      return acc;
    },
    {} as Record<number, typeof memberData.assignments>
  ) || {};

  const periodNumbers = Object.keys(assignmentsByPeriod)
    .map(Number)
    .sort((a, b) => b - a); // 최신순 정렬

  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(
    periodNumbers[0] || null
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <header className="bg-navy text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 -ml-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              aria-label="뒤로가기"
            >
              <svg
                className="w-6 h-6"
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
            </button>
            <span className="font-semibold text-lg">NVP</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
              aria-label="로그아웃"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {isLoading ? (
          // Skeleton UI
          <div className="space-y-6">
            {/* Greeting Skeleton */}
            <div className="space-y-2">
              <div className="h-5 bg-gray-bg rounded w-24 animate-pulse" />
              <div className="h-6 bg-gray-bg rounded w-32 animate-pulse" />
            </div>

            {/* Profile Card Skeleton */}
            <div className="card p-6">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-bg rounded-lg animate-pulse" />
                    <div className="h-4 bg-gray-bg rounded w-16 animate-pulse" />
                    <div className="h-5 bg-gray-bg rounded w-12 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Menu List Skeleton */}
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="card p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-gray-bg rounded animate-pulse" />
                    <div className="h-5 bg-gray-bg rounded w-24 animate-pulse" />
                  </div>
                  <div className="w-5 h-5 bg-gray-bg rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={fetchMemberData}
              className="mt-2 text-sm text-red-600 underline"
            >
              다시 시도
            </button>
          </div>
        ) : memberData ? (
          <>
            {/* Header Section */}
            <div className="mb-6">
              <p className="text-gray-text text-sm mb-1">안녕하세요</p>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-navy">
                    {memberData.name || "회원"} 님
                  </h2>
                  {memberData.email && (
                    <p className="text-sm text-gray-text mt-1">{memberData.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* User Summary Card */}
            <div className="card p-6 mb-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* 등번호 */}
                <div className="stat-item">
                  <div className="stat-icon mb-2">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <p className="stat-label">등번호</p>
                  <p className="stat-value">
                    {memberData.backNumber ? `${memberData.backNumber}번` : "-"}
                  </p>
                </div>

                {/* 직급 */}
                <div className="stat-item">
                  <div className="stat-icon mb-2">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <p className="stat-label">직급</p>
                  <p className="stat-value">
                    {currentAssignment?.displayName || "게스트"}
                  </p>
                </div>

                {/* 기수 */}
                <div className="stat-item">
                  <div className="stat-icon mb-2">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                      />
                    </svg>
                  </div>
                  <p className="stat-label">기수</p>
                  <p className="stat-value">
                    {currentAssignment
                      ? `${currentAssignment.periodNumber}기`
                      : "-"}
                  </p>
                </div>
              </div>

              {/* 기수별 역할 탭 */}
              {periodNumbers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-border">
                  <p className="text-sm font-medium text-gray-dark mb-3">
                    역대 활동 이력
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {periodNumbers.map((periodNum) => {
                      const assignments = assignmentsByPeriod[periodNum];
                      const displayName =
                        assignments?.[0]?.displayName || "역할 없음";
                      const isActive = selectedPeriod === periodNum;

                      return (
                        <button
                          key={periodNum}
                          onClick={() => setSelectedPeriod(periodNum)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                            isActive
                              ? "bg-navy text-white"
                              : "bg-gray-bg text-gray-dark hover:bg-gray-200"
                          }`}
                        >
                          {periodNum}기 {displayName !== "역할 없음" && displayName}
                        </button>
                      );
                    })}
                  </div>
                  {selectedPeriod && (
                    <div className="mt-3 p-3 bg-gray-bg rounded-lg">
                      <p className="text-sm text-gray-text mb-1">역할</p>
                      <p className="text-base font-semibold text-navy">
                        {assignmentsByPeriod[selectedPeriod]?.[0]?.displayName ||
                          "역할 없음"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Menu */}
            <div className="space-y-2">
              {/* 회원정보 수정 */}
              <Link href="/mypage/edit" className="nav-item card">
                <div className="flex items-center gap-4">
                  <svg
                    className="w-6 h-6 text-navy"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                    <circle cx="17" cy="5" r="1.5" fill="currentColor" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 5l2 2"
                    />
                  </svg>
                  <span className="text-gray-dark">회원정보 수정</span>
                </div>
                <svg
                  className="w-5 h-5 text-gray-text"
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
              </Link>

              {/* 비밀번호 재설정 */}
              <Link href="/mypage/password" className="nav-item card">
                <div className="flex items-center gap-4">
                  <svg
                    className="w-6 h-6 text-navy"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span className="text-gray-dark">비밀번호 재설정</span>
                </div>
                <svg
                  className="w-5 h-5 text-gray-text"
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
              </Link>

              {/* 개인기록 */}
              <Link href="/mypage/score" className="nav-item card">
                <div className="flex items-center gap-4">
                  <svg
                    className="w-6 h-6 text-navy"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span className="text-gray-dark">개인기록</span>
                </div>
                <svg
                  className="w-5 h-5 text-gray-text"
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
              </Link>

              {/* 출석 */}
              <Link href="/mypage/attendance" className="nav-item card">
                <div className="flex items-center gap-4">
                  <svg
                    className="w-6 h-6 text-navy"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-gray-dark">출석</span>
                </div>
                <svg
                  className="w-5 h-5 text-gray-text"
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
              </Link>
            </div>

            {/* 회원 탈퇴 섹션 */}
            <div className="mt-8 pt-6 border-t border-gray-border">
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="w-full nav-item card border-2 border-red-200 hover:border-red-300 hover:bg-red-50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span className="text-red-600 font-medium">회원 탈퇴</span>
                </div>
                <svg
                  className="w-5 h-5 text-red-400"
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
              </button>
            </div>
          </>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-600">
              회원 정보를 불러올 수 없습니다. 다시 시도해주세요.
            </p>
            <button
              onClick={fetchMemberData}
              className="mt-2 text-sm text-yellow-600 underline"
            >
              다시 시도
            </button>
          </div>
        )}
      </main>

      {/* 회원 탈퇴 확인 모달 */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-navy mb-4">
              회원 탈퇴
            </h3>
            <p className="text-sm text-gray-text mb-6">
              정말 탈퇴하시겠습니까? 탈퇴하시면 모든 정보가 삭제되며 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                disabled={isWithdrawing}
                className="flex-1 btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isWithdrawing ? "처리 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

