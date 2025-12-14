"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TournamentResponse, TournamentListResponse } from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 공개 경기 목록 페이지 (비회원 포함 모든 사용자 접근 가능)
 * 현재는 대회 목록을 보여주고, 각 대회의 경기를 볼 수 있도록 함
 */
export default function PublicMatchesPage() {
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
        setTournaments(data.result);
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
          <h1 className="text-lg font-semibold text-navy">경기 목록</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-5 bg-gray-bg rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-bg rounded w-1/2" />
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <p className="text-gray-text mb-2">등록된 경기가 없습니다</p>
          </div>
        )}

        {/* Tournament List - 각 대회를 클릭하면 해당 대회의 경기 목록으로 이동 */}
        {!isLoading && !error && tournaments.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-text mb-4">
              대회를 선택하여 경기 목록을 확인하세요
            </p>
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.id}`}
                className="card p-4 hover:shadow-card-lg transition-shadow block"
              >
                <h3 className="font-semibold text-navy mb-2">
                  {tournament.tournamentName}
                </h3>
                <p className="text-sm text-gray-text">
                  {tournament.isSixPlayer ? "6인제" : "9인제"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


