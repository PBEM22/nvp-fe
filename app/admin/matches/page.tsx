"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MatchResponse } from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 관리자 경기 목록 페이지
 */
export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: 경기 목록 API가 없으므로 일단 빈 배열로 처리
      // 실제 API가 준비되면 아래 주석을 해제하고 사용
      /*
      const response = await fetch(getApiEndpoint("/api/v1/matches"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("경기 목록을 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      if ((data.isSuccess || data.success) && data.result) {
        setMatches(data.result);
      } else {
        throw new Error(data.message || "경기 목록을 불러오는데 실패했습니다.");
      }
      */
      setMatches([]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "경기 목록을 불러오는데 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-navy">경기 목록</h1>
          <Link
            href="/admin/matches/create"
            className="btn-primary"
            style={{ width: "auto", padding: "8px 16px" }}
          >
            경기 생성
          </Link>
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
              onClick={fetchMatches}
              className="mt-2 text-sm text-red-600 underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && matches.length === 0 && (
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
            <p className="text-sm text-gray-text">새로운 경기를 생성해보세요</p>
            <Link
              href="/admin/matches/create"
              className="btn-primary mt-4"
              style={{ width: "auto", padding: "8px 16px" }}
            >
              경기 생성하기
            </Link>
          </div>
        )}

        {/* Match List */}
        {!isLoading && !error && matches.length > 0 && (
          <div className="space-y-4">
            {matches.map((match) => (
              <Link
                key={match.id}
                href={`/admin/matches/${match.id}`}
                className="card p-4 hover:shadow-card-lg transition-shadow block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-navy mb-2">
                      {match.tournamentName}
                    </h3>
                    <p className="text-sm text-gray-text mb-1">
                      vs {match.opponentDisplayName}
                    </p>
                    <p className="text-xs text-gray-text">
                      {formatDate(match.matchDate)}
                      <span className="ml-2">
                        {((match as any).male ?? match.isMale) ? '남자부' : '여자부'}
                      </span>
                      {match.matchLocation && ` · ${match.matchLocation}`}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span
                      className={`tag ${
                        ((match as any).win ?? match.isWin) === true
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {((match as any).win ?? match.isWin) === true ? "승" : "패"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

