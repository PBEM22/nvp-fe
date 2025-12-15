"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { TournamentResponse, TournamentListResponse } from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 공개 대회 목록 페이지 (비회원 포함 모든 사용자 접근 가능)
 */
export default function PublicTournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<TournamentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiEndpoint("/api/v1/tournaments"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("대회 목록을 불러오는데 실패했습니다.");
      }

      const data: TournamentListResponse = await response.json();
      if (data.isSuccess && data.result) {
        console.log("대회 목록 API 응답:", {
          tournamentCount: data.result.length,
          sampleTournament: data.result[0],
        });
        const validTournaments = data.result.filter((t) => t.id !== null && t.id !== undefined);
        console.log("유효한 대회 개수:", validTournaments.length);
        setTournaments(validTournaments);
      } else {
        throw new Error(data.message || "대회 목록을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "대회 목록을 불러오는데 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDDay = (date?: string): number | null => {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diff = targetDate.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
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
          <h1 className="text-lg font-semibold text-navy">대회 목록</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card p-4 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-bg rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-bg rounded w-3/4" />
                    <div className="h-4 bg-gray-bg rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={fetchTournaments}
              className="mt-2 text-sm text-red-600 underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && tournaments.length === 0 && (
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
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <p className="text-gray-text mb-2">등록된 대회가 없습니다</p>
          </div>
        )}

        {/* Tournament List */}
        {!isLoading && !error && tournaments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-text">
                전체 {tournaments.length}개
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {tournaments
                .filter((tournament) => tournament.id !== null && tournament.id !== undefined)
                .map((tournament) => {
                  const dDay = calculateDDay(); // 날짜 정보가 없으므로 null 반환
                  return (
                    <Link
                      key={tournament.id}
                      href={`/tournaments/${tournament.id}`}
                      className="card p-4 hover:shadow-card-lg transition-shadow"
                    >
                    {/* Avatar/Icon Area */}
                    <div className="flex items-center justify-center w-full aspect-square bg-gray-bg rounded-lg mb-3 overflow-hidden">
                      {dDay !== null ? (
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-xs text-gray-text mb-1">D-Day</span>
                          <span className="text-2xl font-bold text-navy">D-{dDay}</span>
                        </div>
                      ) : (
                        <Image
                          src="/logo.png"
                          alt="NVP 로고"
                          width={64}
                          height={64}
                          className="object-contain"
                        />
                      )}
                    </div>

                    {/* Tournament Name */}
                    <h3 className="font-semibold text-navy mb-2 line-clamp-2 text-center">
                      {tournament.tournamentName}
                    </h3>

                    {/* Tournament Info */}
                    <div className="space-y-1 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs text-blue">
                          {tournament.isSixPlayer ? "6인제" : "9인제"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


