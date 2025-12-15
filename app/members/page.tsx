"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  MemberInfoResponse,
  PageMemberInfoResponse,
  PeriodResponse,
  DepartmentResponse,
} from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 공개 회원 목록 페이지 (비회원 포함 모든 사용자 접근 가능)
 */
export default function PublicMembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberInfoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 필터 상태
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [keyword, setKeyword] = useState<string>("");

  // 필터 옵션 목록
  const [periods, setPeriods] = useState<PeriodResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [currentPeriodNumber, setCurrentPeriodNumber] = useState<number | null>(null);

  useEffect(() => {
    fetchFilterOptions();
    fetchCurrentPeriod();
  }, []);

  useEffect(() => {
    setPage(0); // 필터 변경 시 첫 페이지로 리셋
    fetchMembers();
  }, [selectedPeriod, selectedDepartment, keyword]);

  useEffect(() => {
    fetchMembers();
  }, [page]);

  const fetchFilterOptions = async () => {
    setIsLoadingFilters(true);
    try {
      const token = localStorage.getItem("accessToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // 기수, 부서 목록을 병렬로 가져오기
      // 기수는 공개용 API 사용, 부서는 관리자 API 사용 (토큰 있으면 시도)
      const [periodsRes, departmentsRes] = await Promise.all([
        fetch(getApiEndpoint("/api/v1/periods"), { method: "GET", headers }).catch(() => null),
        fetch(getApiEndpoint("/api/admin/departments"), { method: "GET", headers }).catch(() => null),
      ]);

      // 기수 목록 (공개용 API)
      if (periodsRes?.ok) {
        const periodsData: any = await periodsRes.json();
        if ((periodsData.isSuccess || periodsData.success) && periodsData.result) {
          setPeriods(periodsData.result);
        }
      }

      // 부서 목록 (관리자 API - 토큰이 있어야 접근 가능)
      if (departmentsRes?.ok) {
        const departmentsData: any = await departmentsRes.json();
        if ((departmentsData.isSuccess || departmentsData.success) && departmentsData.result) {
          setDepartments(departmentsData.result);
        }
      }
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const fetchCurrentPeriod = async () => {
    try {
      const response = await fetch(getApiEndpoint("/api/v1/periods/current"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data: any = await response.json();
        if (data.isSuccess && data.result) {
          setCurrentPeriodNumber(data.result.periodNumber);
        }
      }
    } catch (err) {
      console.error("Failed to fetch current period:", err);
    }
  };

  const fetchMembers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: "20",
      });

      // 필터 파라미터 추가
      if (selectedPeriod !== null) {
        queryParams.append("periodNumber", selectedPeriod.toString());
      }
      if (selectedDepartment !== null) {
        queryParams.append("departmentId", selectedDepartment.toString());
      }
      if (keyword.trim() !== "") {
        queryParams.append("keyword", keyword.trim());
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // 토큰이 있으면 Authorization 헤더 추가
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        getApiEndpoint(`/api/v1/members?${queryParams.toString()}`),
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
          
          // 토큰 없이 재시도
          const retryResponse = await fetch(
            getApiEndpoint(`/api/v1/members?${queryParams.toString()}`),
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!retryResponse.ok) {
            throw new Error("회원 목록을 불러오는데 실패했습니다.");
          }

          const retryData: any = await retryResponse.json();
          if ((retryData.isSuccess || retryData.success) && retryData.result) {
            setMembers(retryData.result.content || []);
            setTotalPages(retryData.result.totalPages || 0);
            setTotalElements(retryData.result.totalElements || 0);
          } else {
            throw new Error(retryData.message || "회원 목록 조회 실패");
          }
          return;
        }
        throw new Error("회원 목록을 불러오는데 실패했습니다.");
      }

      const data: any = await response.json();
      if (data.isSuccess && data.result) {
        const memberList = data.result.content || [];
        console.log("멤버 목록 API 응답:", {
          totalElements: data.result.totalElements,
          totalPages: data.result.totalPages,
          memberCount: memberList.length,
          sampleMember: memberList[0],
        });
        setMembers(memberList);
        setTotalPages(data.result.totalPages || 0);
        setTotalElements(data.result.totalElements || 0);
      } else {
        throw new Error(data.message || "회원 목록 조회 실패");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "회원 목록을 불러오는데 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 -ml-2 text-navy hover:bg-gray-bg rounded-lg transition-colors"
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
          <h1 className="text-lg font-semibold text-navy">회원 목록</h1>
          <div className="text-sm text-gray-text">
            전체 {totalElements}명
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Filter Section */}
        <div className="card p-4 mb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-navy">필터</h2>
              <button
                onClick={() => {
                  setSelectedPeriod(null);
                  setSelectedDepartment(null);
                  setKeyword("");
                  setPage(0);
                }}
                className="text-sm text-gray-text hover:text-navy underline"
              >
                초기화
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 검색어 */}
              <div>
                <label
                  htmlFor="keyword-filter"
                  className="block text-sm font-medium text-gray-dark mb-1"
                >
                  검색어 (이름/학과)
                </label>
                <input
                  id="keyword-filter"
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="이름 또는 학과"
                  className="input w-full"
                />
              </div>

              {/* 기수 필터 */}
              <div>
                <label
                  htmlFor="period-filter"
                  className="block text-sm font-medium text-gray-dark mb-1"
                >
                  기수
                </label>
                <select
                  id="period-filter"
                  value={selectedPeriod === null ? "" : selectedPeriod}
                  onChange={(e) =>
                    setSelectedPeriod(
                      e.target.value === "" ? null : parseInt(e.target.value)
                    )
                  }
                  className="select-custom w-full text-base"
                  disabled={isLoadingFilters}
                  style={{ fontSize: '16px' }}
                >
                  <option value="">전체</option>
                  {periods
                    .sort((a, b) => b.periodNumber - a.periodNumber)
                    .map((period) => (
                      <option key={period.id} value={period.periodNumber} style={{ fontSize: '16px' }}>
                        {period.periodNumber}기 ({period.year}년 {period.semester}학기)
                        {period.isCurrent && " - 현재 기수"}
                      </option>
                    ))}
                </select>
              </div>

              {/* 부서 필터 */}
              <div>
                <label
                  htmlFor="department-filter"
                  className="block text-sm font-medium text-gray-dark mb-1"
                >
                  부서
                </label>
                <select
                  id="department-filter"
                  value={selectedDepartment === null ? "" : selectedDepartment}
                  onChange={(e) =>
                    setSelectedDepartment(
                      e.target.value === "" ? null : parseInt(e.target.value)
                    )
                  }
                  className="select-custom w-full text-base"
                  disabled={isLoadingFilters}
                  style={{ fontSize: '16px' }}
                >
                  <option value="">전체</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id} style={{ fontSize: '16px' }}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="w-16 h-16 bg-gray-bg rounded-full mx-auto mb-3" />
                <div className="h-4 bg-gray-bg rounded w-3/4 mx-auto mb-2" />
                <div className="h-3 bg-gray-bg rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={fetchMembers}
              className="mt-2 text-sm text-red-600 underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Member List */}
        {!isLoading && !error && (
          <>
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-gray-bg rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-10 h-10 text-gray-text"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-text mb-2">등록된 회원이 없습니다</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {members
                    .filter((member) => member.memberId !== null && member.memberId !== undefined)
                    .map((member) => (
                      <Link
                        key={member.memberId}
                        href={`/members/${member.memberId}`}
                        className="card p-4 hover:shadow-card-lg transition-shadow text-center"
                      >
                      <div className="w-16 h-16 bg-gray-bg rounded-full mx-auto mb-3 flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                      </div>
                      <h3 className="font-semibold text-navy mb-1 truncate">
                        {member.name || '-'}
                      </h3>
                      {member.periodNumber && member.displayName && (
                        <p 
                          className={`text-xs font-medium mb-1 truncate ${
                            currentPeriodNumber === member.periodNumber
                              ? "text-navy bg-blue-100 px-2 py-1 rounded"
                              : "text-navy"
                          }`}
                          title={`${member.periodNumber}기 ${member.displayName}${currentPeriodNumber === member.periodNumber ? " (현재 기수)" : ""}`}
                        >
                          {`${member.periodNumber}기 ${member.displayName}`}
                          {currentPeriodNumber === member.periodNumber && (
                            <span className="ml-1 text-blue-600">●</span>
                          )}
                        </p>
                      )}
                      {member.major && (
                        <p className="text-xs text-gray-text mb-2 truncate" title={member.major}>
                          {member.major}
                        </p>
                      )}
                      <span
                        className={`tag-sm ${
                          member.membershipStatus === 'ACTIVE_MEMBER'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : member.membershipStatus === 'ALUMNI'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : member.membershipStatus === 'WITHDRAWN'
                            ? 'bg-gray-100 text-gray-700 border-gray-200'
                            : ''
                        }`}
                      >
                        {member.membershipStatus === 'ACTIVE_MEMBER'
                          ? '활동 회원'
                          : member.membershipStatus === 'ALUMNI'
                          ? '졸업생'
                          : member.membershipStatus === 'WITHDRAWN'
                          ? '탈퇴'
                          : member.membershipStatus}
                      </span>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ width: "auto", padding: "8px 16px" }}
                    >
                      이전
                    </button>
                    <span className="text-sm text-gray-text">
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ width: "auto", padding: "8px 16px" }}
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

