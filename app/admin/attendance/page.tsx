"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
  GenerateCodeRequest,
  GenerateCodeResponse,
  AttendanceRound,
  DailyAttendanceStatusResponse,
  UpdateAttendanceRequest,
  AttendanceStatus,
  PeriodResponse,
  PeriodMemberAttendanceSummaryResponse,
} from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 관리자 출석 관리 페이지
 */
export default function AdminAttendancePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"code" | "status">("code");
  
  // 출석 코드 생성 관련
  const [selectedRound, setSelectedRound] = useState<AttendanceRound | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GenerateCodeResponse | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isInvalidating, setIsInvalidating] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 출석 현황 관리 관련
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceList, setAttendanceList] = useState<DailyAttendanceStatusResponse[]>([]);
  const [periodAttendanceList, setPeriodAttendanceList] = useState<Array<{
    date: string;
    members: DailyAttendanceStatusResponse[];
  }>>([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    memberId: number;
    memberName: string;
    round: AttendanceRound;
    oldStatus: string;
    newStatus: AttendanceStatus;
    date?: string;
  } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periods, setPeriods] = useState<PeriodResponse[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [currentPeriodId, setCurrentPeriodId] = useState<number | null>(null);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false);
  const [viewMode, setViewMode] = useState<"date" | "period">("date"); // "date" 또는 "period"
  const [periodSummaryList, setPeriodSummaryList] = useState<PeriodMemberAttendanceSummaryResponse[]>([]);

  // 카운트다운 타이머
  useEffect(() => {
    if (timeRemaining > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [timeRemaining]);

  // 페이지 이탈 감지 (브라우저 닫기/새로고침)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (generatedCode && timeRemaining > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    if (generatedCode && timeRemaining > 0) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [generatedCode, timeRemaining]);

  // 라우터 이탈 감지 (Next.js 라우팅)
  useEffect(() => {
    const handleRouteChange = () => {
      if (generatedCode && timeRemaining > 0) {
        setShowConfirmModal(true);
      }
    };

    // Next.js router 이벤트는 여기서는 직접 처리하기 어려우므로
    // 모달이 열려있을 때는 라우팅을 막는 방식으로 처리
  }, [generatedCode, timeRemaining]);

  const handleGenerateCode = async () => {
    if (!selectedRound) {
      setError("회차를 선택해주세요.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const requestBody: GenerateCodeRequest = {
        round: selectedRound,
      };

      const response = await fetch(
        getApiEndpoint("/api/admin/attendance/code"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
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
        throw new Error(
          errorData.message || "출석 코드 생성에 실패했습니다."
        );
      }

      const data: any = await response.json();
      const isSuccess = data.isSuccess || data.success;

      if (isSuccess && data.result) {
        setGeneratedCode(data.result);
        // 카운트다운 시작
        setTimeRemaining(data.result.expiresIn);
      } else {
        throw new Error(data.message || "출석 코드 생성에 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "출석 코드 생성에 실패했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInvalidateCode = async () => {
    setIsInvalidating(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        getApiEndpoint("/api/admin/attendance/code"),
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
        throw new Error(
          errorData.message || "출석 코드 종료에 실패했습니다."
        );
      }

      const data: any = await response.json();
      const isSuccess = data.isSuccess || data.success;

      if (isSuccess) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
        setGeneratedCode(null);
        setTimeRemaining(0);
        setShowConfirmModal(false);
      } else {
        throw new Error(data.message || "출석 코드 종료에 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "출석 코드 종료에 실패했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsInvalidating(false);
    }
  };

  const handleCloseModal = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmClose = () => {
    handleInvalidateCode();
  };

  const handleCancelClose = () => {
    setShowConfirmModal(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 날짜별 출석 현황 조회
  const fetchAttendanceByDate = useCallback(async () => {
    setIsLoadingAttendance(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const url = `/api/admin/attendance/${selectedDate}`;
      const response = await fetch(
        getApiEndpoint(url),
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "출석 현황을 불러오는데 실패했습니다."
        );
      }

      const data: any = await response.json();
      const isSuccess = data.isSuccess || data.success;

      if (isSuccess && data.result) {
        setAttendanceList(data.result);
        setPeriodAttendanceList([]);
      } else {
        throw new Error(data.message || "출석 현황을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "출석 현황을 불러오는데 실패했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [selectedDate]);

  // 기수별 출석 현황 조회 (새로운 API 사용)
  const fetchAttendanceByPeriod = useCallback(async () => {
    setIsLoadingAttendance(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      if (selectedPeriodId === null) {
        setPeriodSummaryList([]);
        setPeriodAttendanceList([]);
        return;
      }

      // 새로운 API 사용: 기수별 출석 요약 정보 조회
      const response = await fetch(
        getApiEndpoint(`/api/admin/periods/${selectedPeriodId}/attendance`),
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "출석 현황을 불러오는데 실패했습니다."
        );
      }

      const data: any = await response.json();
      const isSuccess = data.isSuccess || data.success;

      if (isSuccess && data.result) {
        // 출석률 기준으로 정렬 (높은 순)
        const sortedSummary = (data.result as PeriodMemberAttendanceSummaryResponse[]).sort(
          (a, b) => b.attendanceRate - a.attendanceRate
        );
        setPeriodSummaryList(sortedSummary);
        setPeriodAttendanceList([]);
        setAttendanceList([]);
      } else {
        throw new Error(data.message || "출석 현황을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "출석 현황을 불러오는데 실패했습니다. 다시 시도해주세요."
      );
      setPeriodSummaryList([]);
      setPeriodAttendanceList([]);
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [selectedPeriodId]);

  // 기수 목록 가져오기
  useEffect(() => {
    if (activeTab === "status") {
      fetchPeriods();
    }
  }, [activeTab]);

  // 날짜 또는 기수 선택 시 출석 현황 재조회
  useEffect(() => {
    if (activeTab === "status") {
      if (viewMode === "date" && selectedDate) {
        fetchAttendanceByDate();
      } else if (viewMode === "period" && selectedPeriodId !== null) {
        fetchAttendanceByPeriod();
      }
    }
  }, [activeTab, selectedDate, selectedPeriodId, viewMode, fetchAttendanceByDate, fetchAttendanceByPeriod]);

  const fetchPeriods = async () => {
    setIsLoadingPeriods(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      // 기수 목록 먼저 가져오기
      const periodsRes = await fetch(getApiEndpoint("/api/v1/periods"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      let periodsList: PeriodResponse[] = [];
      if (periodsRes.ok) {
        const periodsData: any = await periodsRes.json();
        if ((periodsData.isSuccess || periodsData.success) && periodsData.result) {
          periodsList = periodsData.result.sort(
            (a: PeriodResponse, b: PeriodResponse) => b.periodNumber - a.periodNumber
          );
          setPeriods(periodsList);
        }
      }

      // 현재 기수 정보 가져오기
      if (periodsList.length > 0) {
        const currentPeriodRes = await fetch(getApiEndpoint("/api/v1/periods/current"), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (currentPeriodRes.ok) {
          const currentPeriodData: any = await currentPeriodRes.json();
          if ((currentPeriodData.isSuccess || currentPeriodData.success) && currentPeriodData.result) {
            // 현재 기수 ID 찾기
            const currentPeriod = periodsList.find(
              (p: PeriodResponse) => p.periodNumber === currentPeriodData.result.periodNumber
            );
            if (currentPeriod) {
              setCurrentPeriodId(currentPeriod.id);
              if (selectedPeriodId === null) {
                setSelectedPeriodId(currentPeriod.id);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch periods:", err);
    } finally {
      setIsLoadingPeriods(false);
    }
  };

  const handleStatusChange = (
    memberId: number,
    memberName: string,
    round: AttendanceRound,
    oldStatus: string,
    newStatus: AttendanceStatus,
    date?: string
  ) => {
    setPendingStatusChange({
      memberId,
      memberName,
      round,
      oldStatus,
      newStatus,
      date,
    });
    setShowStatusConfirmModal(true);
  };

  // 출석 현황 테이블 렌더링 함수
  const renderAttendanceTable = (members: DailyAttendanceStatusResponse[], date: string) => {
    const calculateFinalStatus = (round1: string, round2: string, defaultStatus?: string): string => {
      const r1 = round1 || "PRESENT";
      const r2 = round2 || "PRESENT";
      
      if (r1 === "PRESENT" && r2 === "PRESENT") {
        return "출석";
      } else if (r1 === "PRESENT" && r2 === "ABSENT") {
        return "조퇴";
      } else if (r1 === "ABSENT" && r2 === "PRESENT") {
        return "지각";
      } else if (r1 === "ABSENT" && r2 === "ABSENT") {
        return "결석";
      }
      return defaultStatus || "미입력";
    };

    return (
      <>
        {/* 데스크톱: 테이블 */}
        <div className="hidden md:block overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-navy text-white">
                  <th className="px-6 py-3 text-left text-sm font-semibold">이름</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">1차 출석</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">2차 출석</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">최종 상태</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const currentFinalStatus = calculateFinalStatus(
                    member.round1Status || "",
                    member.round2Status || "",
                    member.finalStatus
                  );

                  return (
                    <tr
                      key={member.memberId}
                      className="border-b border-gray-border hover:bg-gray-bg transition-colors"
                    >
                      <td className="px-6 py-3 text-sm font-medium text-navy whitespace-nowrap">
                        {member.memberName}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <select
                          value={member.round1Status || "PRESENT"}
                          onChange={(e) =>
                            handleStatusChange(
                              member.memberId,
                              member.memberName,
                              1,
                              member.round1Status || "",
                              e.target.value as AttendanceStatus,
                              date
                            )
                          }
                          className="select-custom text-sm"
                          disabled={isUpdatingStatus}
                        >
                          <option value="PRESENT">출석</option>
                          <option value="ABSENT">결석</option>
                        </select>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <select
                          value={member.round2Status || "PRESENT"}
                          onChange={(e) =>
                            handleStatusChange(
                              member.memberId,
                              member.memberName,
                              2,
                              member.round2Status || "",
                              e.target.value as AttendanceStatus,
                              date
                            )
                          }
                          className="select-custom text-sm"
                          disabled={isUpdatingStatus}
                        >
                          <option value="PRESENT">출석</option>
                          <option value="ABSENT">결석</option>
                        </select>
                      </td>
                      <td className="px-6 py-3 text-center text-sm text-gray-text whitespace-nowrap">
                        {currentFinalStatus}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 모바일: 카드 레이아웃 */}
        <div className="md:hidden space-y-3 p-4">
          {members.map((member) => {
            const currentFinalStatus = calculateFinalStatus(
              member.round1Status || "",
              member.round2Status || "",
              member.finalStatus
            );

            return (
              <div key={member.memberId} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-navy">{member.memberName}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    currentFinalStatus === "출석" ? "bg-green-100 text-green-700" :
                    currentFinalStatus === "지각" ? "bg-yellow-100 text-yellow-700" :
                    currentFinalStatus === "조퇴" ? "bg-orange-100 text-orange-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {currentFinalStatus}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-text">1차 출석</span>
                    <select
                      value={member.round1Status || "PRESENT"}
                      onChange={(e) =>
                        handleStatusChange(
                          member.memberId,
                          member.memberName,
                          1,
                          member.round1Status || "",
                          e.target.value as AttendanceStatus,
                          date
                        )
                      }
                      className="select-custom text-sm"
                      disabled={isUpdatingStatus}
                    >
                      <option value="PRESENT">출석</option>
                      <option value="ABSENT">결석</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-text">2차 출석</span>
                    <select
                      value={member.round2Status || "PRESENT"}
                      onChange={(e) =>
                        handleStatusChange(
                          member.memberId,
                          member.memberName,
                          2,
                          member.round2Status || "",
                          e.target.value as AttendanceStatus,
                          date
                        )
                      }
                      className="select-custom text-sm"
                      disabled={isUpdatingStatus}
                    >
                      <option value="PRESENT">출석</option>
                      <option value="ABSENT">결석</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange) return;

    setIsUpdatingStatus(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const requestBody: UpdateAttendanceRequest = {
        memberId: pendingStatusChange.memberId,
        date: pendingStatusChange.date || selectedDate,
        round: pendingStatusChange.round,
        status: pendingStatusChange.newStatus,
      };

      const response = await fetch(
        getApiEndpoint("/api/admin/attendance/status"),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
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
        throw new Error(
          errorData.message || "출석 상태 변경에 실패했습니다."
        );
      }

      const data: any = await response.json();
      const isSuccess = data.isSuccess || data.success;

      if (isSuccess) {
        // 출석 현황 다시 불러오기
        if (viewMode === "date") {
          await fetchAttendanceByDate();
        } else if (viewMode === "period") {
          await fetchAttendanceByPeriod();
        }
        setShowStatusConfirmModal(false);
        setPendingStatusChange(null);
      } else {
        throw new Error(data.message || "출석 상태 변경에 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "출석 상태 변경에 실패했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelStatusChange = () => {
    setShowStatusConfirmModal(false);
    setPendingStatusChange(null);
  };

  const getStatusDisplayText = (status: string | undefined): string => {
    if (!status) return "미입력";
    switch (status) {
      case "PRESENT":
        return "출석";
      case "ABSENT":
        return "결석";
      case "LATE":
        return "지각";
      case "EARLY_LEAVE":
        return "조퇴";
      default:
        return status;
    }
  };

  // 코드를 6자리 배열로 변환
  const codeDigits = generatedCode
    ? generatedCode.code.split("").slice(0, 6)
    : ["", "", "", "", "", ""];

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
          <h1 className="text-lg font-semibold text-navy">출석 관리</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-border bg-white">
        <div className="flex">
          <button
            onClick={() => setActiveTab("code")}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === "code"
                ? "text-navy border-b-2 border-navy"
                : "text-gray-text"
            }`}
          >
            출석 코드 생성
          </button>
          <button
            onClick={() => setActiveTab("status")}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === "status"
                ? "text-navy border-b-2 border-navy"
                : "text-gray-text"
            }`}
          >
            출석 현황 관리
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 py-8">
        {activeTab === "code" ? (
          <div className="max-w-md mx-auto">
          {/* 회차 선택 */}
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">출석 코드 생성</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-dark mb-2">
                  회차 선택
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedRound(1)}
                    disabled={isGenerating || generatedCode !== null}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      selectedRound === 1
                        ? "bg-navy text-white"
                        : "bg-gray-bg text-gray-text hover:bg-gray-border"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    1차
                  </button>
                  <button
                    onClick={() => setSelectedRound(2)}
                    disabled={isGenerating || generatedCode !== null}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      selectedRound === 2
                        ? "bg-navy text-white"
                        : "bg-gray-bg text-gray-text hover:bg-gray-border"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    2차
                  </button>
                </div>
              </div>

              <button
                onClick={handleGenerateCode}
                disabled={!selectedRound || isGenerating || generatedCode !== null}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? "생성 중..." : "출석 코드 생성"}
              </button>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* 생성된 코드 모달 */}
          {generatedCode && !showConfirmModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                {/* 모달 헤더 */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-navy">
                    출석 코드 ({selectedRound}차)
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-text hover:text-navy transition-colors"
                    aria-label="닫기"
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

                {/* 카운트다운 */}
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-text mb-2">남은 시간</p>
                  <p className="text-3xl font-bold text-navy">
                    {formatTime(timeRemaining)}
                  </p>
                </div>

                {/* 코드 표시 (출석 입력 디자인과 동일) */}
                <div className="mb-6">
                  <p className="text-sm text-gray-text text-center mb-4">
                    출석 코드
                  </p>
                  <div className="flex gap-2 justify-center px-2">
                    {codeDigits.map((digit, index) => (
                      <div
                        key={index}
                        className="flex-1 max-w-[14%] aspect-square text-center text-2xl font-bold border-2 rounded-lg border-navy bg-blue-light text-navy flex items-center justify-center"
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 출석 종료 버튼 */}
                <button
                  onClick={handleCloseModal}
                  disabled={isInvalidating}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInvalidating ? "종료 중..." : "출석 종료하기"}
                </button>
              </div>
            </div>
          )}

          {/* 확인 모달 */}
          {showConfirmModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                <h3 className="text-lg font-semibold text-navy mb-4">
                  출석을 종료하시겠습니까?
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelClose}
                    disabled={isInvalidating}
                    className="flex-1 btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    아니오
                  </button>
                  <button
                    onClick={handleConfirmClose}
                    disabled={isInvalidating}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isInvalidating ? "종료 중..." : "예"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* 조회 모드 선택 및 필터 */}
            <div className="card p-6 mb-6">
              {/* 조회 모드 선택 버튼 */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setViewMode("date");
                    setSelectedPeriodId(null);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    viewMode === "date"
                      ? "bg-navy text-white"
                      : "bg-gray-bg text-gray-text hover:bg-gray-border"
                  }`}
                >
                  날짜별 조회
                </button>
                <button
                  onClick={() => {
                    setViewMode("period");
                    setSelectedDate(new Date().toISOString().split("T")[0]);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    viewMode === "period"
                      ? "bg-navy text-white"
                      : "bg-gray-bg text-gray-text hover:bg-gray-border"
                  }`}
                >
                  기수별 조회
                </button>
              </div>

              {/* 날짜 선택 (날짜 모드일 때만 표시) */}
              {viewMode === "date" && (
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-2">
                    날짜 선택
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input w-full"
                  />
                </div>
              )}

              {/* 기수 선택 (기수 모드일 때만 표시) */}
              {viewMode === "period" && (
                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-2">
                    기수 선택
                  </label>
                  <select
                    value={selectedPeriodId === null ? "" : selectedPeriodId}
                    onChange={(e) =>
                      setSelectedPeriodId(
                        e.target.value === "" ? null : parseInt(e.target.value)
                      )
                    }
                    className="select-custom w-full text-base"
                    disabled={isLoadingPeriods}
                    style={{ fontSize: '16px' }}
                  >
                    <option value="">기수를 선택하세요</option>
                    {isLoadingPeriods ? (
                      <option>로딩 중...</option>
                    ) : (
                      periods.map((period) => {
                        const isCurrent = period.id === currentPeriodId;
                        return (
                          <option key={period.id} value={period.id} style={{ fontSize: '16px' }}>
                            {period.periodNumber}기 ({period.year}년 {period.semester}학기)
                            {isCurrent ? " - 현재 기수" : ""}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              )}
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            {/* 출석 현황 테이블 */}
            {isLoadingAttendance ? (
              <div className="card p-6">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-gray-bg rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ) : viewMode === "date" ? (
              // 날짜 모드: 해당 날짜의 출석 현황만 표시
              attendanceList.length === 0 ? (
                <div className="card p-6 text-center">
                  <p className="text-gray-text">해당 날짜의 출석 현황이 없습니다.</p>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  {renderAttendanceTable(attendanceList, selectedDate)}
                </div>
              )
            ) : (
              // 기수 모드: 회원별 출석 요약 정보 표시
              periodSummaryList.length === 0 ? (
                <div className="card p-6 text-center">
                  <p className="text-gray-text">
                    {selectedPeriodId === null 
                      ? "기수를 선택해주세요." 
                      : "해당 기수의 출석 현황이 없습니다."}
                  </p>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  {/* 데스크톱: 테이블 */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-navy text-white">
                          <th className="px-6 py-3 text-left text-sm font-semibold">이름</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold">총 운동일</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold">출석</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold">지각</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold">조퇴</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold">결석</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold">출석률</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periodSummaryList.map((summary) => (
                          <tr
                            key={summary.memberId}
                            className="border-b border-gray-border hover:bg-gray-bg transition-colors"
                          >
                            <td className="px-6 py-3 text-sm font-medium text-navy whitespace-nowrap">
                              {summary.memberName}
                            </td>
                            <td className="px-6 py-3 text-center text-sm text-gray-text">
                              {summary.totalExerciseDays}일
                            </td>
                            <td className="px-6 py-3 text-center text-sm text-green-600 font-medium">
                              {summary.presentDays}일
                            </td>
                            <td className="px-6 py-3 text-center text-sm text-yellow-600 font-medium">
                              {summary.lateDays}일
                            </td>
                            <td className="px-6 py-3 text-center text-sm text-orange-600 font-medium">
                              {summary.earlyLeaveDays}일
                            </td>
                            <td className="px-6 py-3 text-center text-sm text-red-600 font-medium">
                              {summary.absentDays}일
                            </td>
                            <td className="px-6 py-3 text-center text-sm font-semibold text-navy">
                              {summary.attendanceRate.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 모바일: 카드 레이아웃 */}
                  <div className="md:hidden space-y-3 p-4">
                    {periodSummaryList.map((summary) => (
                      <div key={summary.memberId} className="card p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-navy">{summary.memberName}</span>
                          <span className="text-sm font-semibold text-navy">
                            {summary.attendanceRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-text">총 운동일</span>
                            <span className="font-medium">{summary.totalExerciseDays}일</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-text">출석</span>
                            <span className="font-medium text-green-600">{summary.presentDays}일</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-text">지각</span>
                            <span className="font-medium text-yellow-600">{summary.lateDays}일</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-text">조퇴</span>
                            <span className="font-medium text-orange-600">{summary.earlyLeaveDays}일</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-text">결석</span>
                            <span className="font-medium text-red-600">{summary.absentDays}일</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* 출석 상태 변경 확인 모달 */}
            {showStatusConfirmModal && pendingStatusChange && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                  <h3 className="text-lg font-semibold text-navy mb-4">
                    출석상태를 변경하시겠습니까?
                  </h3>
                  <div className="mb-4 p-3 bg-gray-bg rounded-lg">
                    <p className="text-sm text-gray-text mb-1">회원: {pendingStatusChange.memberName}</p>
                    <p className="text-sm text-gray-text mb-1">
                      회차: {pendingStatusChange.round}차
                    </p>
                    <p className="text-sm text-gray-text">
                      {getStatusDisplayText(pendingStatusChange.oldStatus)} →{" "}
                      {getStatusDisplayText(pendingStatusChange.newStatus)}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancelStatusChange}
                      disabled={isUpdatingStatus}
                      className="flex-1 btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      아니오
                    </button>
                    <button
                      onClick={handleConfirmStatusChange}
                      disabled={isUpdatingStatus}
                      className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdatingStatus ? "변경 중..." : "예"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

