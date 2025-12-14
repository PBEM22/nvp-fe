"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { 
  CheckInRequest, 
  TodayAttendanceResponse,
  GroupedMyAttendanceResponse,
  PeriodAttendance,
} from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 출석 페이지
 */
export default function AttendancePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"checkin" | "history">("checkin");
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendanceResponse | null>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [attendanceHistory, setAttendanceHistory] = useState<PeriodAttendance[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPeriodNumber, setCurrentPeriodNumber] = useState<number | null>(null);

  const handleCodeChange = (index: number, value: string) => {
    // 숫자만 입력 허용
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(null);
    setSuccess(false);

    // 자동으로 다음 입력 필드로 이동
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace 키 처리
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newCode = [...code];
    
    for (let i = 0; i < 6; i++) {
      if (i < pastedData.length && /^\d$/.test(pastedData[i])) {
        newCode[i] = pastedData[i];
      } else {
        newCode[i] = "";
      }
    }
    
    setCode(newCode);
    
    // 마지막 입력 필드로 포커스 이동
    if (pastedData.length === 6) {
      const lastInput = document.getElementById("code-5");
      lastInput?.focus();
    } else if (pastedData.length > 0) {
      const nextInput = document.getElementById(`code-${pastedData.length}`);
      nextInput?.focus();
    }
  };

  const handleSubmit = async () => {
    const fullCode = code.join("");
    
    if (fullCode.length !== 6) {
      setError("6자리 코드를 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const requestBody: CheckInRequest = {
        code: fullCode,
      };

      const response = await fetch(
        getApiEndpoint("/api/v1/attendance/check-in"),
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
          errorData.message || "출석 처리에 실패했습니다. 코드를 확인해주세요."
        );
      }

      const data: any = await response.json();
      const isSuccess = data.isSuccess || data.success;

      if (isSuccess) {
        setSuccess(true);
        // 출석 상태 다시 불러오기
        fetchTodayAttendance();
        // 2초 후 코드 초기화
        setTimeout(() => {
          setCode(["", "", "", "", "", ""]);
          setSuccess(false);
          const firstInput = document.getElementById("code-0");
          firstInput?.focus();
        }, 2000);
      } else {
        throw new Error(data.message || "출석 처리에 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "출석 처리에 실패했습니다. 다시 시도해주세요."
      );
      // 에러 시 코드 초기화
      setCode(["", "", "", "", "", ""]);
      const firstInput = document.getElementById("code-0");
      firstInput?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
    if (activeTab === "history") {
      fetchAttendanceHistory();
    }
  }, [activeTab]);

  const fetchTodayAttendance = async () => {
    setIsLoadingAttendance(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        getApiEndpoint("/api/v1/attendance/today"),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data: any = await response.json();
        const isSuccess = data.isSuccess || data.success;
        if (isSuccess && data.result) {
          setTodayAttendance(data.result);
        }
      }
    } catch (err) {
      console.error("Failed to fetch today attendance:", err);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        getApiEndpoint("/api/v1/members/me/attendance"),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data: any = await response.json();
        const isSuccess = data.isSuccess || data.success;
        if (isSuccess && data.result) {
          setAttendanceHistory(data.result.attendanceByPeriods || []);
          setCurrentPeriodNumber(data.result.currentPeriodNumber || null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch attendance history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const getStatusText = (status: string | undefined): string => {
    if (!status) return "미입력";
    
    // 이미 한글로 오는 경우 그대로 반환
    if (status === "출석" || status === "지각" || status === "조퇴" || status === "결석") {
      return status;
    }
    
    // 영어 코드인 경우 한글로 변환
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
        return status; // 알 수 없는 값이어도 그대로 표시
    }
  };

  const getStatusColor = (status: string | undefined): string => {
    if (!status) return "text-gray-text";
    
    // 한글 상태 처리
    if (status === "출석") return "text-green-600";
    if (status === "결석") return "text-red-600";
    if (status === "지각") return "text-yellow-600";
    if (status === "조퇴") return "text-orange-600";
    
    // 영어 코드 처리
    switch (status) {
      case "PRESENT":
        return "text-green-600";
      case "ABSENT":
        return "text-red-600";
      case "LATE":
        return "text-yellow-600";
      case "EARLY_LEAVE":
        return "text-orange-600";
      default:
        return "text-gray-text";
    }
  };

  const isCodeComplete = code.every((digit) => digit !== "");

  return (
    <div className="min-h-screen bg-white">
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
          <h1 className="text-lg font-semibold text-navy">출석하기</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* 탭 메뉴 */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("checkin")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                activeTab === "checkin"
                  ? "bg-navy text-white"
                  : "bg-gray-bg text-gray-dark hover:bg-gray-200"
              }`}
            >
              출석하기
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                activeTab === "history"
                  ? "bg-navy text-white"
                  : "bg-gray-bg text-gray-dark hover:bg-gray-200"
              }`}
            >
              출석 기록
            </button>
          </div>

          {/* 출석하기 탭 */}
          {activeTab === "checkin" && (
            <>
              {/* 오늘의 출석 상태 */}
              {!isLoadingAttendance && todayAttendance && (
                <div className="card p-4 mb-6">
                  <h3 className="text-sm font-semibold text-navy mb-3">오늘의 출석 상태</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-text mb-1">1차 출석</p>
                      <p className={`text-sm font-medium ${getStatusColor(todayAttendance.round1Status)}`}>
                        {getStatusText(todayAttendance.round1Status)}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-text mb-1">2차 출석</p>
                      <p className={`text-sm font-medium ${getStatusColor(todayAttendance.round2Status)}`}>
                        {getStatusText(todayAttendance.round2Status)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 설명 */}
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-navy mb-2">출석 코드 입력</h2>
                <p className="text-sm text-gray-text">
                  6자리 출석 코드를 입력해주세요
                </p>
              </div>

          {/* 코드 입력 필드 */}
          <div className="mb-6">
            <div className="flex gap-2 justify-center px-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`flex-1 max-w-[14%] aspect-square text-center text-2xl font-bold border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-navy ${
                    digit
                      ? "border-navy bg-blue-light text-navy"
                      : "border-gray-border bg-white text-gray-text"
                  } ${
                    error
                      ? "border-red-500"
                      : success
                      ? "border-green-500 bg-green-50"
                      : ""
                  }`}
                  disabled={isSubmitting}
                />
              ))}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-sm text-green-600 font-semibold">
                  출석이 완료되었습니다!
                </p>
              </div>
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={!isCodeComplete || isSubmitting}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "처리 중..." : "출석하기"}
          </button>

              {/* 안내 메시지 */}
              <div className="mt-6 p-4 bg-gray-bg rounded-lg">
                <p className="text-xs text-gray-text text-center">
                  출석 코드는 운영진이 발급한 6자리 숫자입니다.
                  <br />
                  코드를 정확히 입력해주세요.
                </p>
              </div>
            </>
          )}

          {/* 출석 기록 탭 */}
          {activeTab === "history" && (
            <div className="space-y-6">
              {isLoadingHistory ? (
                <div className="card p-6">
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-gray-bg rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              ) : attendanceHistory.length === 0 ? (
                <div className="card p-6 text-center">
                  <p className="text-gray-text">출석 기록이 없습니다.</p>
                </div>
              ) : (
                attendanceHistory.map((periodAttendance, index) => {
                  const isCurrent = currentPeriodNumber === periodAttendance.period.number;
                  return (
                    <div key={index} className="card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-navy">
                          {periodAttendance.period.number}기 ({periodAttendance.period.year}년 {periodAttendance.period.semester}학기)
                        </h3>
                        {isCurrent && (
                          <span className="tag-sm bg-blue-100 text-blue-700 border-blue-200">
                            현재 기수
                          </span>
                        )}
                      </div>
                      
                      {/* 출석률 요약 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-bg rounded-lg">
                        <div>
                          <p className="text-xs text-gray-text mb-1">전체 출석률</p>
                          <p className="text-lg font-bold text-navy">
                            {periodAttendance.summary.attendanceRate.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-text mb-1">출석일수</p>
                          <p className="text-lg font-bold text-green-600">
                            {periodAttendance.summary.totalPresentDays}일
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-text mb-1">지각/조퇴</p>
                          <p className="text-lg font-bold text-yellow-600">
                            {periodAttendance.summary.totalLateDays + periodAttendance.summary.totalEarlyLeaveDays}일
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-text mb-1">결석일수</p>
                          <p className="text-lg font-bold text-red-600">
                            {periodAttendance.summary.totalAbsentDays}일
                          </p>
                        </div>
                      </div>

                      {/* 상세 내역 */}
                      {periodAttendance.details.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-gray-dark mb-2">상세 내역</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {periodAttendance.details.map((detail, detailIndex) => (
                              <div
                                key={detailIndex}
                                className="flex items-center justify-between p-2 bg-gray-bg rounded text-sm"
                              >
                                <span className="text-gray-dark">{detail.date}</span>
                                <span className={`font-medium ${getStatusColor(detail.finalStatus)}`}>
                                  {getStatusText(detail.finalStatus)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

