"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type {
  MemberDetailResponse,
  MemberDetailResponseWrapper,
} from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 공개 회원 상세 페이지
 */
export default function PublicMemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params?.memberId as string;

  const [memberData, setMemberData] = useState<MemberDetailResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (memberId) {
      fetchMemberData();
    }
  }, [memberId]);

  const fetchMemberData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        getApiEndpoint(`/api/v1/members/${memberId}`),
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // 인증 오류 시 토큰 제거하고 재시도 (비회원으로)
          localStorage.removeItem("accessToken");
          localStorage.removeItem("memberId");
          localStorage.removeItem("userRoles");

          const retryResponse = await fetch(
            getApiEndpoint(`/api/v1/members/${memberId}`),
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!retryResponse.ok) {
            throw new Error("회원 정보를 불러오는데 실패했습니다.");
          }

          const retryData: any = await retryResponse.json();
          const isSuccess = retryData.isSuccess || retryData.success;

          if (isSuccess && retryData.result) {
            setMemberData(retryData.result);
          } else {
            throw new Error(
              retryData.message || "회원 정보를 불러오는데 실패했습니다."
            );
          }
          return;
        }
        throw new Error("회원 정보를 불러오는데 실패했습니다.");
      }

      const data: any = await response.json();
      const isSuccess = data.isSuccess || data.success;

      if (isSuccess && data.result) {
        setMemberData(data.result);
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

  // 생년월일 포맷팅
  const formatBirthday = (birthday?: string) => {
    if (!birthday) return "-";
    const date = new Date(birthday);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

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
            <span className="font-semibold text-lg">회원 상세</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {isLoading ? (
          // Skeleton UI
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-5 bg-gray-bg rounded w-24 animate-pulse" />
              <div className="h-6 bg-gray-bg rounded w-32 animate-pulse" />
            </div>

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
              <h2 className="text-xl font-bold text-navy">
                {memberData.name || "회원"}
              </h2>
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

              {/* 기수별 역할 탭 - public이 true일 때만 표시 */}
              {((memberData as any).public ?? memberData.isPublic) && periodNumbers.length > 0 && (
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

              {/* 연혁 비공개 안내 */}
              {!((memberData as any).public ?? memberData.isPublic) && (
                <div className="mt-4 pt-4 border-t border-gray-border">
                  <p className="text-sm text-gray-text text-center">
                    연혁 정보가 비공개로 설정되어 있습니다.
                  </p>
                </div>
              )}
            </div>

            {/* 상세 정보 카드 */}
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-semibold text-navy mb-4">상세 정보</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-border">
                  <span className="text-sm text-gray-text">학과</span>
                  <span className="text-sm font-medium text-gray-dark">
                    {memberData.major || "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-border">
                  <span className="text-sm text-gray-text">생년월일</span>
                  <span className="text-sm font-medium text-gray-dark">
                    {formatBirthday(memberData.birthday)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-border">
                  <span className="text-sm text-gray-text">성별</span>
                  <span className="text-sm font-medium text-gray-dark">
                    {memberData.isMale === true || (memberData as any).male === true
                      ? "남성"
                      : memberData.isMale === false || (memberData as any).male === false
                      ? "여성"
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-text">회원 상태</span>
                  <span
                    className={`tag-sm ${
                      memberData.membershipStatus === "ACTIVE_MEMBER"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : memberData.membershipStatus === "ALUMNI"
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : memberData.membershipStatus === "WITHDRAWN"
                        ? "bg-gray-100 text-gray-700 border-gray-200"
                        : ""
                    }`}
                  >
                    {memberData.membershipStatus === "ACTIVE_MEMBER"
                      ? "활동 회원"
                      : memberData.membershipStatus === "ALUMNI"
                      ? "졸업생"
                      : memberData.membershipStatus === "WITHDRAWN"
                      ? "탈퇴"
                      : memberData.membershipStatus}
                  </span>
                </div>
              </div>
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
    </div>
  );
}

