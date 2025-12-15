"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  MemberSummaryResponse,
  MemberInfoResponse,
  MemberListResponse,
  PageMemberInfoResponse,
  PeriodResponse,
  DepartmentResponse,
  PeriodListResponse,
  DepartmentListResponse,
} from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 관리자 회원 목록 페이지
 */
export default function MembersPage() {
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

  // 회원 등록 관련 상태
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // 필터 옵션 로드
  useEffect(() => {
    fetchFilterOptions();
    fetchCurrentPeriod();
  }, []);

  const fetchCurrentPeriod = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(getApiEndpoint("/api/v1/periods/current"), {
        method: "GET",
        headers,
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

  const fetchFilterOptions = async () => {
    setIsLoadingFilters(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // 기수, 부서 목록을 병렬로 가져오기
      const [periodsRes, departmentsRes] = await Promise.all([
        fetch(getApiEndpoint("/api/v1/periods"), { method: "GET", headers }),
        fetch(getApiEndpoint("/api/admin/departments"), { method: "GET", headers }),
      ]);

      // 기수 목록 처리
      if (periodsRes.ok) {
        const periodsData: any = await periodsRes.json();
        const isSuccess = periodsData.isSuccess || periodsData.success;
        if (isSuccess && periodsData.result) {
          setPeriods(periodsData.result);
        } else {
          console.error("Failed to fetch periods:", periodsData.message || "Unknown error");
        }
      } else {
        const errorData = await periodsRes.json().catch(() => ({}));
        console.error("Periods API error:", periodsRes.status, errorData);
      }

      // 부서 목록 처리
      if (departmentsRes.ok) {
        const departmentsData: any = await departmentsRes.json();
        const isSuccess = departmentsData.isSuccess || departmentsData.success;
        if (isSuccess && departmentsData.result) {
          setDepartments(departmentsData.result);
        } else {
          console.error("Failed to fetch departments:", departmentsData.message || "Unknown error");
        }
      } else {
        const errorData = await departmentsRes.json().catch(() => ({}));
        console.error("Departments API error:", departmentsRes.status, errorData);
      }
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
    } finally {
      setIsLoadingFilters(false);
    }
  };

  // 전체 회원 데이터를 저장하는 상태
  const [allMembers, setAllMembers] = useState<MemberInfoResponse[]>([]);
  const [isLoadingAllMembers, setIsLoadingAllMembers] = useState(false);

  // 전체 회원 데이터 가져오기 (필터링 전)
  const fetchAllMembers = useCallback(async () => {
    setIsLoadingAllMembers(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      // 모든 페이지를 순회하여 전체 데이터 가져오기
      let allMembersData: MemberInfoResponse[] = [];
      let currentPage = 0;
      let totalPagesCount = 1;

      do {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          size: "100", // 큰 사이즈로 가져오기
        });

        const apiUrl = getApiEndpoint(`/api/admin/members?${queryParams.toString()}`);
        const response = await fetch(apiUrl, {
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
          throw new Error("회원 목록을 불러오는데 실패했습니다.");
        }

        const data: any = await response.json();
        const isSuccess = data.isSuccess || data.success;
        if (isSuccess && data.result) {
          const rawMemberList = data.result.content || [];
          const memberList = rawMemberList
            .map((member: any) => ({
              ...member,
              periodNumber: member.periodNumber || member.period_number,
              displayName: member.displayName || member.display_name,
              major: member.major,
              memberId: member.memberId ?? member.id,
              email: member.email,
            }))
            .filter((member: any) => member.memberId !== null && member.memberId !== undefined && !isNaN(member.memberId)) as MemberInfoResponse[];
          
          allMembersData = [...allMembersData, ...memberList];
          totalPagesCount = data.result.totalPages || 1;
          currentPage++;
        } else {
          break;
        }
      } while (currentPage < totalPagesCount);

      setAllMembers(allMembersData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "회원 목록을 불러오는데 실패했습니다."
      );
    } finally {
      setIsLoadingAllMembers(false);
    }
  }, [router]);

  // 클라이언트 사이드 필터링 및 페이지네이션
  const applyFiltersAndPagination = useCallback(() => {
    let filtered = [...allMembers];

    // 기수 필터링
    if (selectedPeriod !== null) {
      filtered = filtered.filter((member) => member.periodNumber === selectedPeriod);
    }

    // 부서 필터링
    if (selectedDepartment !== null) {
      const department = departments.find((d) => d.id === selectedDepartment);
      if (department) {
        filtered = filtered.filter((member) => member.departmentName === department.name);
      }
    }

    // 키워드 필터링 (이름 또는 학과)
    if (keyword.trim() !== "") {
      const keywordLower = keyword.trim().toLowerCase();
      filtered = filtered.filter(
        (member) =>
          (member.name && member.name.toLowerCase().includes(keywordLower)) ||
          (member.major && member.major.toLowerCase().includes(keywordLower))
      );
    }

    // 페이지네이션
    const pageSize = 20;
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filtered.slice(startIndex, endIndex);
    const totalPagesCount = Math.ceil(filtered.length / pageSize) || 1;

    setMembers(paginated);
    setTotalPages(totalPagesCount);
    setTotalElements(filtered.length);
    setIsLoading(false);
  }, [allMembers, selectedPeriod, selectedDepartment, keyword, page, departments]);

  // 전체 회원 데이터 가져오기
  useEffect(() => {
    fetchAllMembers();
  }, [fetchAllMembers]);

  // 필터링 및 페이지네이션 적용
  useEffect(() => {
    if (!isLoadingAllMembers && allMembers.length >= 0) {
      applyFiltersAndPagination();
    } else if (isLoadingAllMembers) {
      setIsLoading(true);
    }
  }, [isLoadingAllMembers, allMembers, applyFiltersAndPagination]);

  // 필터 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setPage(0);
  }, [selectedPeriod, selectedDepartment, keyword]);

  const handleResetFilters = () => {
    setSelectedPeriod(null);
    setSelectedDepartment(null);
    setKeyword("");
    setPage(0);
  };

  // 템플릿 다운로드
  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch(
        getApiEndpoint("/api/admin/members/upload/template"),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("템플릿 다운로드에 실패했습니다.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "회원등록_템플릿.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "템플릿 다운로드에 실패했습니다.");
    }
  };

  // 엑셀 파일 업로드
  const handleUploadFile = async () => {
    if (!uploadFile) {
      setUploadError("파일을 선택해주세요.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await fetch(
        getApiEndpoint("/api/admin/members/upload"),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "회원 등록에 실패했습니다.");
      }

      const data: any = await response.json();
      const result = data.result || data.message || "회원 등록이 완료되었습니다.";
      
      setUploadSuccess(true);
      setUploadFile(null);
      
      // 성공 메시지 표시 후 모달 닫고 목록 새로고침
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadSuccess(false);
        fetchAllMembers();
      }, 2000);
      
      alert(result);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "회원 등록에 실패했습니다."
      );
    } finally {
      setIsUploading(false);
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
        {/* 액션 버튼들 */}
        <div className="mb-4 flex gap-3 justify-end">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="btn-primary"
            style={{ width: "auto", padding: "8px 16px" }}
          >
            회원 등록
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="btn-outline"
            style={{ width: "auto", padding: "8px 16px" }}
          >
            템플릿 다운로드
          </button>
        </div>

        {/* Filter Section */}
        <div className="card p-4 mb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-navy">필터</h2>
              <button
                onClick={handleResetFilters}
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
                  {isLoadingFilters ? (
                    <option value="" disabled>로딩 중...</option>
                  ) : periods.length > 0 ? (
                    periods
                      .sort((a, b) => b.periodNumber - a.periodNumber)
                      .map((period) => (
                        <option key={period.id} value={period.periodNumber} style={{ fontSize: '16px' }}>
                          {period.periodNumber}기 ({period.year}년 {period.semester}학기)
                        </option>
                      ))
                  ) : (
                    <option value="" disabled>기수 데이터가 없습니다</option>
                  )}
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
                  {isLoadingFilters ? (
                    <option value="" disabled>로딩 중...</option>
                  ) : departments.length > 0 ? (
                    departments.map((dept) => (
                      <option key={dept.id} value={dept.id} style={{ fontSize: '16px' }}>
                        {dept.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>부서 데이터가 없습니다</option>
                  )}
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
              onClick={fetchAllMembers}
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {members.map((member) => (
                  <Link
                    key={member.memberId}
                    href={`/admin/members/${member.memberId}`}
                    className="card p-4 hover:shadow-card-lg transition-shadow text-center"
                  >
                  <div className="w-16 h-16 bg-gray-bg rounded-full mx-auto mb-3 flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <h3 className="font-semibold text-navy mb-1 truncate">
                    {member.name || '-'}
                  </h3>
                  {member.periodNumber ? (
                    <p 
                      className={`text-xs font-medium mb-1 truncate ${
                        currentPeriodNumber === member.periodNumber
                          ? "text-navy bg-blue-100 px-2 py-1 rounded"
                          : "text-navy"
                      }`}
                      title={`${member.periodNumber}기${member.displayName ? ` ${member.displayName}` : ''}${currentPeriodNumber === member.periodNumber ? " (현재 기수)" : ""}`}
                    >
                      {`${member.periodNumber}기${member.displayName ? ` ${member.displayName}` : ''}`}
                      {currentPeriodNumber === member.periodNumber && (
                        <span className="ml-1 text-blue-600">●</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mb-1">기수 없음</p>
                  )}
                  {member.major ? (
                    <p className="text-xs text-gray-text mb-1 truncate" title={member.major}>
                      {member.major}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mb-1">학과 없음</p>
                  )}
                  {member.email ? (
                    <p className="text-xs text-gray-text mb-2 truncate" title={member.email}>
                      {member.email}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mb-2">이메일 없음</p>
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
            )}

            {/* Pagination */}
            {members.length > 0 && totalPages > 1 && (
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

        {/* 회원 등록 모달 */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-navy">회원 등록</h2>
                  <button
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setUploadFile(null);
                      setUploadError(null);
                      setUploadSuccess(false);
                    }}
                    className="text-gray-text hover:text-navy"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {uploadError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{uploadError}</p>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600">회원 등록이 완료되었습니다!</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* 템플릿 다운로드 링크 */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleDownloadTemplate}
                      className="text-sm text-navy hover:underline"
                    >
                      템플릿 다운로드
                    </button>
                  </div>

                  {/* 파일 업로드 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      엑셀 파일 업로드 (XLSX)
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        setUploadFile(e.target.files?.[0] || null);
                        setUploadError(null);
                      }}
                      className="input w-full"
                      disabled={isUploading}
                    />
                    {uploadFile && (
                      <p className="mt-2 text-xs text-gray-text">
                        선택된 파일: {uploadFile.name}
                      </p>
                    )}
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setIsUploadModalOpen(false);
                        setUploadFile(null);
                        setUploadError(null);
                        setUploadSuccess(false);
                      }}
                      className="btn-outline flex-1"
                      disabled={isUploading}
                    >
                      취소
                    </button>
                    <button
                      onClick={handleUploadFile}
                      className="btn-primary flex-1"
                      disabled={isUploading || !uploadFile}
                    >
                      {isUploading ? "업로드 중..." : "업로드"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

