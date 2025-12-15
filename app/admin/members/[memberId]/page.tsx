"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import type {
  MemberDetailResponse,
  MemberDetailResponseWrapper,
  UpdateMyInfoRequest,
  PeriodResponse,
  DepartmentResponse,
  PositionResponse,
  AssignPositionRequest,
} from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 관리자 회원 상세 페이지
 */
export default function AdminMemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params?.memberId as string;

  const [memberData, setMemberData] = useState<MemberDetailResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 수정 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPeriodModal, setShowAddPeriodModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // 기수 추가용 데이터
  const [periods, setPeriods] = useState<PeriodResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [positions, setPositions] = useState<PositionResponse[]>([]);
  
  // 수정 폼
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors },
    setValue: setEditValue,
    watch: watchEdit,
  } = useForm<UpdateMyInfoRequest & { backNumber?: number }>({
    defaultValues: {
      name: "",
      major: "",
      backNumber: undefined,
    },
  });
  
  // 기수 추가 폼
  const {
    register: registerPeriod,
    handleSubmit: handleSubmitPeriod,
    formState: { errors: periodErrors },
    reset: resetPeriod,
  } = useForm<AssignPositionRequest>({
    defaultValues: {
      departmentId: 0,
      positionId: 0,
      periodId: 0,
    },
  });

  useEffect(() => {
    if (memberId) {
      fetchMemberData();
      fetchFilterOptions();
    }
  }, [memberId]);
  
  useEffect(() => {
    if (memberData && showEditModal) {
      setEditValue("name", memberData.name || "");
      setEditValue("major", memberData.major || "");
      setEditValue("backNumber", memberData.backNumber || undefined);
    }
  }, [memberData, showEditModal, setEditValue]);
  
  const fetchFilterOptions = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      
      // 기수, 부서, 직책 목록 가져오기
      const [periodsRes, departmentsRes, positionsRes] = await Promise.all([
        fetch(getApiEndpoint("/api/v1/periods"), {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(getApiEndpoint("/api/admin/departments"), {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(getApiEndpoint("/api/admin/positions"), {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);
      
      if (periodsRes.ok) {
        const periodsData: any = await periodsRes.json();
        if (periodsData.isSuccess || periodsData.success) {
          setPeriods(periodsData.result || []);
        }
      }
      
      if (departmentsRes.ok) {
        const departmentsData: any = await departmentsRes.json();
        if (departmentsData.isSuccess || departmentsData.success) {
          setDepartments(departmentsData.result || []);
        }
      }
      
      if (positionsRes.ok) {
        const positionsData: any = await positionsRes.json();
        if (positionsData.isSuccess || positionsData.success) {
          setPositions(positionsData.result || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
    }
  };

  const fetchMemberData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        getApiEndpoint(`/api/admin/members/${memberId}`),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
  
  // 회원 정보 수정
  const onSubmitEdit = async (data: UpdateMyInfoRequest & { backNumber?: number }) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }
      
      // 관리자용 회원 정보 수정 API 시도
      // UpdateMyInfoRequest에 backNumber가 없으므로 별도 처리
      const updateData: any = {
        name: data.name,
        major: data.major,
      };
      
      if (data.backNumber !== undefined) {
        updateData.backNumber = data.backNumber;
      }
      
      const response = await fetch(
        getApiEndpoint(`/api/admin/members/${memberId}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("memberId");
          router.push("/login");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "회원 정보 수정에 실패했습니다.");
      }
      
      const result: any = await response.json();
      const isSuccess = result.isSuccess || result.success;
      
      if (isSuccess) {
        setSuccessMessage("회원 정보가 성공적으로 수정되었습니다.");
        setShowEditModal(false);
        // 데이터 다시 불러오기
        setTimeout(() => {
          fetchMemberData();
          setSuccessMessage(null);
        }, 1500);
      } else {
        throw new Error(result.message || "회원 정보 수정에 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "회원 정보 수정에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 기수 추가 (직책 할당)
  const onSubmitPeriod = async (data: AssignPositionRequest) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }
      
      if (!memberData?.userId) {
        throw new Error("회원 정보를 불러올 수 없습니다.");
      }
      
      const response = await fetch(
        getApiEndpoint(`/api/admin/users/${memberData.userId}/assignments`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("memberId");
          router.push("/login");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "기수 추가에 실패했습니다.");
      }
      
      const result: any = await response.json();
      const isSuccess = result.isSuccess || result.success;
      
      if (isSuccess) {
        setSuccessMessage("기수가 성공적으로 추가되었습니다.");
        setShowAddPeriodModal(false);
        resetPeriod();
        // 데이터 다시 불러오기
        setTimeout(() => {
          fetchMemberData();
          setSuccessMessage(null);
        }, 1500);
      } else {
        throw new Error(result.message || "기수 추가에 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "기수 추가에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 회원 강제 탈퇴
  const handleWithdrawMember = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }
      
      const response = await fetch(
        getApiEndpoint(`/api/admin/members/${memberId}`),
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("memberId");
          router.push("/login");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "회원 탈퇴 처리에 실패했습니다.");
      }
      
      const result: any = await response.json();
      const isSuccess = result.isSuccess || result.success;
      
      if (isSuccess) {
        setSuccessMessage("회원 탈퇴가 완료되었습니다.");
        setShowWithdrawModal(false);
        // 회원 목록 페이지로 이동
        setTimeout(() => {
          router.push("/admin/members");
        }, 1500);
      } else {
        throw new Error(result.message || "회원 탈퇴 처리에 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "회원 탈퇴 처리에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
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
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
          >
            수정
          </button>
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

            {/* 성공 메시지 */}
            {successMessage && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{successMessage}</p>
              </div>
            )}
            
            {/* 상세 정보 카드 */}
            <div className="card p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-navy">상세 정보</h3>
                <button
                  onClick={() => setShowAddPeriodModal(true)}
                  className="px-3 py-1.5 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-800 transition-colors"
                >
                  기수 추가
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-border">
                  <span className="text-sm text-gray-text">이름</span>
                  <span className="text-sm font-medium text-gray-dark">
                    {memberData.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-border">
                  <span className="text-sm text-gray-text">이메일</span>
                  <span className="text-sm font-medium text-gray-dark">
                    {memberData.email || "-"}
                  </span>
                </div>
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
              
              {/* 회원 탈퇴 버튼 */}
              <div className="mt-6 pt-6 border-t border-gray-border">
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="w-full px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
                >
                  회원 탈퇴 처리
                </button>
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
        
        {/* 회원 정보 수정 모달 */}
        {showEditModal && memberData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-navy mb-4">회원 정보 수정</h3>
              
              <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    이름
                  </label>
                  <input
                    type="text"
                    {...registerEdit("name", {
                      required: "이름을 입력해주세요.",
                    })}
                    className="input w-full"
                    placeholder="이름"
                  />
                  {editErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{editErrors.name.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    등번호
                  </label>
                  <input
                    type="number"
                    {...registerEdit("backNumber", {
                      min: { value: 0, message: "0 이상의 숫자를 입력해주세요." },
                      max: { value: 99, message: "99 이하의 숫자를 입력해주세요." },
                    })}
                    className="input w-full"
                    placeholder="등번호"
                  />
                  {editErrors.backNumber && (
                    <p className="text-sm text-red-500 mt-1">{editErrors.backNumber.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    학과
                  </label>
                  <input
                    type="text"
                    {...registerEdit("major", {
                      required: "학과를 입력해주세요.",
                    })}
                    className="input w-full"
                    placeholder="학과"
                  />
                  {editErrors.major && (
                    <p className="text-sm text-red-500 mt-1">{editErrors.major.message}</p>
                  )}
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setError(null);
                    }}
                    disabled={isSubmitting}
                    className="flex-1 btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "수정 중..." : "수정하기"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* 기수 추가 모달 */}
        {showAddPeriodModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-navy mb-4">기수 추가</h3>
              
              <form onSubmit={handleSubmitPeriod(onSubmitPeriod)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    기수
                  </label>
                  <select
                    {...registerPeriod("periodId", {
                      required: "기수를 선택해주세요.",
                      valueAsNumber: true,
                    })}
                    className="input w-full"
                  >
                    <option value="">기수를 선택하세요</option>
                    {periods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.year}년 {period.semester}학기 ({period.periodNumber}기)
                      </option>
                    ))}
                  </select>
                  {periodErrors.periodId && (
                    <p className="text-sm text-red-500 mt-1">{periodErrors.periodId.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    부서
                  </label>
                  <select
                    {...registerPeriod("departmentId", {
                      required: "부서를 선택해주세요.",
                      valueAsNumber: true,
                    })}
                    className="input w-full"
                  >
                    <option value="">부서를 선택하세요</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {periodErrors.departmentId && (
                    <p className="text-sm text-red-500 mt-1">{periodErrors.departmentId.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1">
                    직책
                  </label>
                  <select
                    {...registerPeriod("positionId", {
                      required: "직책을 선택해주세요.",
                      valueAsNumber: true,
                    })}
                    className="input w-full"
                  >
                    <option value="">직책을 선택하세요</option>
                    {positions.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.name}
                      </option>
                    ))}
                  </select>
                  {periodErrors.positionId && (
                    <p className="text-sm text-red-500 mt-1">{periodErrors.positionId.message}</p>
                  )}
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPeriodModal(false);
                      setError(null);
                      resetPeriod();
                    }}
                    disabled={isSubmitting}
                    className="flex-1 btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "추가 중..." : "추가하기"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* 회원 탈퇴 확인 모달 */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-navy mb-4">회원 탈퇴 처리</h3>
              <p className="text-sm text-gray-text mb-6">
                정말로 이 회원을 탈퇴 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleWithdrawMember}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "처리 중..." : "탈퇴 처리"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

