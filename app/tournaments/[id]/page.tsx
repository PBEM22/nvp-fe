"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type { TournamentResponse, MemberMatchResponse } from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 공개 대회 상세 페이지 (경기 목록 포함) - 비회원 포함 모든 사용자 접근 가능
 */
export default function PublicTournamentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params?.id as string;

  const [tournament, setTournament] = useState<TournamentResponse | null>(null);
  const [matches, setMatches] = useState<MemberMatchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentDetail();
      fetchMatches();
    }
  }, [tournamentId]);

  const fetchTournamentDetail = async () => {
    try {
      const response = await fetch(
        getApiEndpoint(`/api/v1/tournaments/${tournamentId}`),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("대회 정보를 불러오는데 실패했습니다.");
      }

      const data: any = await response.json();
      if ((data.isSuccess || data.success) && data.result) {
        setTournament(data.result);
      } else {
        throw new Error(data.message || "대회 정보를 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "대회 정보를 불러오는데 실패했습니다."
      );
      setIsLoading(false);
    }
  };

  const fetchMatches = async () => {
    if (!tournamentId) return;
    
    try {
      // 해당 대회의 경기 목록 가져오기
      const response = await fetch(
        getApiEndpoint(`/api/v1/tournaments/${tournamentId}/matches`),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("경기 목록을 불러오는데 실패했습니다.");
      }

      const data: any = await response.json();
      const isSuccess = data.isSuccess || data.success;
      
      if (isSuccess && data.result) {
        console.log("경기 목록 API 응답:", {
          matchCount: data.result.length,
          sampleMatch: data.result[0],
        });
        const validMatches = data.result.filter((m: any) => (m.matchId || m.id) !== null && (m.matchId || m.id) !== undefined);
        console.log("유효한 경기 개수:", validMatches.length);
        setMatches(validMatches);
      } else {
        throw new Error(data.message || "경기 목록을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      console.error("경기 목록 로드 실패:", err);
      setError(
        err instanceof Error
          ? err.message
          : "경기 목록을 불러오는데 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString || dateString.trim() === "") return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-5 bg-gray-bg rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-bg rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 py-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              {error || "대회 정보를 불러올 수 없습니다."}
            </p>
            <button
              onClick={() => router.back()}
              className="mt-2 text-sm text-red-600 underline"
            >
              뒤로가기
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-lg font-semibold text-navy">대회 상세</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Tournament Info */}
        <div className="card p-6 mb-6">
          <h2 className="text-2xl font-bold text-navy mb-4">
            {(tournament as any).name || tournament.tournamentName}
          </h2>
          <div className="space-y-2 text-sm text-gray-text">
            {(tournament as any).startDate && (tournament as any).endDate && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-dark">기간:</span>
                <span>
                  {formatDate((tournament as any).startDate)} ~ {formatDate((tournament as any).endDate)}
                </span>
              </div>
            )}
            {(tournament as any).location && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-dark">장소:</span>
                <span>{(tournament as any).location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Matches Section */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-navy mb-4">경기 목록</h3>
        </div>

        {matches.length === 0 ? (
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
        ) : (
          <div className="space-y-4">
            {matches
              .filter((match) => {
                const id = (match as any).matchId ?? (match as any).id;
                return id !== null && id !== undefined;
              })
              .map((match) => {
                const matchId = (match as any).matchId ?? (match as any).id;
                return (
                  <Link
                    key={matchId}
                    href={`/matches/${matchId}`}
                    className="card p-4 hover:shadow-card-lg transition-shadow block"
                  >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-navy mb-1">
                      vs {match.opponentDisplayName}
                    </p>
                    <p className="text-xs text-gray-text mb-1">
                      {formatDate(match.matchDate)}
                      <span className="ml-2">
                        {((match as any).male ?? match.isMale) ? '남자부' : '여자부'}
                      </span>
                    </p>
                    {match.teamScore !== undefined && match.opponentScore !== undefined && (
                      <p className="text-sm font-medium text-navy">
                        {match.teamScore} : {match.opponentScore}
                      </p>
                    )}
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
                );
              })}
          </div>
        )}
      </main>
    </div>
  );
}

