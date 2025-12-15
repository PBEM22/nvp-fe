"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import type {
  MatchCreateRequest,
  TournamentResponse,
  TournamentListResponse,
  OpponentSchoolResponse,
  OpponentSchoolListResponse,
  CreatedResponse,
  ApiResponse,
} from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 관리자 경기 생성 페이지
 */
export default function CreateMatchPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<TournamentResponse[]>([]);
  const [opponentSchools, setOpponentSchools] = useState<OpponentSchoolResponse[]>([]);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);
  const [isLoadingOpponentSchools, setIsLoadingOpponentSchools] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{
    tournamentId: number;
    opponentSchoolId: number;
    isMale: string;
    matchLocation: string;
    matchDate: string;
  }>({
    defaultValues: {
      tournamentId: 0,
      opponentSchoolId: 0,
      isMale: "true",
      matchLocation: "",
      matchDate: "",
    },
  });

  const isMaleValue = watch("isMale");

  // 대회 목록 가져오기
  useEffect(() => {
    const fetchTournaments = async () => {
      setIsLoadingTournaments(true);
      setError(null);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(getApiEndpoint("/api/v1/tournaments"), {
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
          throw new Error("대회 목록을 불러오는데 실패했습니다.");
        }

        const data: any = await response.json();
        const isSuccess = data.isSuccess || data.success;
        if (isSuccess && data.result) {
          // API 응답의 sixPlayer를 isSixPlayer로 변환
          const mappedTournaments = data.result.map((t: any) => ({
            ...t,
            isSixPlayer: t.isSixPlayer ?? t.sixPlayer,
          })) as TournamentResponse[];
          setTournaments(mappedTournaments);
        } else {
          throw new Error(data.message || "대회 목록을 불러오는데 실패했습니다.");
        }
      } catch (err) {
        console.error("Failed to fetch tournaments:", err);
        setError(err instanceof Error ? err.message : "대회 목록을 불러오는데 실패했습니다.");
      } finally {
        setIsLoadingTournaments(false);
      }
    };

    fetchTournaments();
  }, [router]);

  // 상대 학교 목록 가져오기
  useEffect(() => {
    const fetchOpponentSchools = async () => {
      setIsLoadingOpponentSchools(true);
      setError(null);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(getApiEndpoint("/api/v1/opponent-schools"), {
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
          throw new Error("상대 학교 목록을 불러오는데 실패했습니다.");
        }

        const data: any = await response.json();
        const isSuccess = data.isSuccess || data.success;
        if (isSuccess && data.result) {
          setOpponentSchools(data.result);
        } else {
          throw new Error(data.message || "상대 학교 목록을 불러오는데 실패했습니다.");
        }
      } catch (err) {
        console.error("Failed to fetch opponent schools:", err);
        setError(err instanceof Error ? err.message : "상대 학교 목록을 불러오는데 실패했습니다.");
      } finally {
        setIsLoadingOpponentSchools(false);
      }
    };

    fetchOpponentSchools();
  }, [router]);

  const onSubmit = async (data: {
    tournamentId: number;
    opponentSchoolId: number;
    isMale: string;
    matchLocation: string;
    matchDate: string;
  }) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const requestData: MatchCreateRequest = {
        tournamentId: data.tournamentId,
        opponentSchoolId: data.opponentSchoolId,
        isMale: data.isMale === "true",
        matchLocation: data.matchLocation,
        matchDate: data.matchDate,
      };

      const response = await fetch(getApiEndpoint("/api/v1/matches"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const responseData: any = await response.json().catch(() => ({
        isSuccess: false,
        success: false,
        code: "ERROR",
        message: "응답을 파싱하는데 실패했습니다.",
      }));

      const isSuccess = responseData.isSuccess || responseData.success;

      if (!response.ok || !isSuccess) {
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("memberId");
          router.push("/login");
          return;
        }
        throw new Error(
          responseData.message || "경기 생성에 실패했습니다. 다시 시도해주세요."
        );
      }

      // 성공 메시지 표시
      setSuccessMessage("경기가 성공적으로 생성되었습니다.");
      
      // 잠시 후 대회 상세 페이지로 이동 (새로고침 파라미터 추가)
      setTimeout(() => {
        router.push(`/admin/tournaments/${data.tournamentId}?refresh=true`);
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "경기 생성에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-lg font-semibold text-navy">경기 생성</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          {/* 대회 선택 */}
          <div className="space-y-2">
            <label
              htmlFor="tournamentId"
              className="block text-sm font-medium text-gray-dark"
            >
              대회 <span className="text-red-500">*</span>
            </label>
            <select
              id="tournamentId"
              {...register("tournamentId", {
                required: "대회를 선택해주세요.",
                validate: (value) =>
                  value > 0 || "대회를 선택해주세요.",
              })}
              disabled={isLoadingTournaments}
              className="input w-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value={0}>
                {isLoadingTournaments 
                  ? "로딩 중..." 
                  : tournaments.length === 0 
                  ? "등록된 대회가 없습니다"
                  : "대회를 선택해주세요"}
              </option>
              {tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.tournamentName}
                </option>
              ))}
            </select>
            {errors.tournamentId && (
              <p className="text-sm text-red-500">
                {errors.tournamentId.message}
              </p>
            )}
            {!isLoadingTournaments && tournaments.length === 0 && (
              <p className="text-sm text-gray-text">
                등록된 대회가 없습니다. 먼저 대회를 생성해주세요.
              </p>
            )}
          </div>

          {/* 상대 학교 선택 */}
          <div className="space-y-2">
            <label
              htmlFor="opponentSchoolId"
              className="block text-sm font-medium text-gray-dark"
            >
              상대 학교 <span className="text-red-500">*</span>
            </label>
            <select
              id="opponentSchoolId"
              {...register("opponentSchoolId", {
                required: "상대 학교를 선택해주세요.",
                validate: (value) =>
                  value > 0 || "상대 학교를 선택해주세요.",
              })}
              disabled={isLoadingOpponentSchools}
              className="input w-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value={0}>
                {isLoadingOpponentSchools
                  ? "로딩 중..."
                  : opponentSchools.length === 0
                  ? "등록된 상대 학교가 없습니다"
                  : "상대 학교를 선택해주세요"}
              </option>
              {opponentSchools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.schoolName} {school.teamName}
                </option>
              ))}
            </select>
            {errors.opponentSchoolId && (
              <p className="text-sm text-red-500">
                {errors.opponentSchoolId.message}
              </p>
            )}
            {!isLoadingOpponentSchools && opponentSchools.length === 0 && (
              <p className="text-sm text-gray-text">
                등록된 상대 학교가 없습니다. 먼저 상대 학교를 생성해주세요.
              </p>
            )}
          </div>

          {/* 성별 선택 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-dark mb-3">
              성별 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  value="true"
                  {...register("isMale", {
                    required: "성별을 선택해주세요.",
                  })}
                  className="sr-only"
                />
                <div
                  className={`btn-outline text-center py-3 transition-all ${
                    isMaleValue === "true"
                      ? "bg-navy text-white border-navy"
                      : ""
                  }`}
                >
                  남자부
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  value="false"
                  {...register("isMale", {
                    required: "성별을 선택해주세요.",
                  })}
                  className="sr-only"
                />
                <div
                  className={`btn-outline text-center py-3 transition-all ${
                    isMaleValue === "false"
                      ? "bg-navy text-white border-navy"
                      : ""
                  }`}
                >
                  여자부
                </div>
              </label>
            </div>
            {errors.isMale && (
              <p className="text-sm text-red-500">{errors.isMale.message}</p>
            )}
          </div>

          {/* 경기 장소 */}
          <div className="space-y-2">
            <label
              htmlFor="matchLocation"
              className="block text-sm font-medium text-gray-dark"
            >
              경기 장소 <span className="text-red-500">*</span>
            </label>
            <input
              id="matchLocation"
              type="text"
              {...register("matchLocation", {
                required: "경기 장소를 입력해주세요.",
                minLength: {
                  value: 2,
                  message: "경기 장소는 2자 이상 입력해주세요.",
                },
              })}
              placeholder="경기 장소를 입력해 주세요."
              className="input w-full"
            />
            {errors.matchLocation && (
              <p className="text-sm text-red-500">
                {errors.matchLocation.message}
              </p>
            )}
          </div>

          {/* 경기 날짜 */}
          <div className="space-y-2">
            <label
              htmlFor="matchDate"
              className="block text-sm font-medium text-gray-dark"
            >
              경기 날짜 <span className="text-red-500">*</span>
            </label>
            <input
              id="matchDate"
              type="date"
              {...register("matchDate", {
                required: "경기 날짜를 선택해주세요.",
              })}
              className="input w-full"
            />
            {errors.matchDate && (
              <p className="text-sm text-red-500">
                {errors.matchDate.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || isLoadingTournaments || isLoadingOpponentSchools}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "생성 중..." : "생성하기"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

