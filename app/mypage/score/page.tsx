"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  ScoreRecordResponse,
  ScoreRecordResponseWrapper,
  TournamentResponse,
  MatchResponse,
} from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 개인기록 페이지
 */
export default function ScoreRecordPage() {
  const router = useRouter();
  const [scoreData, setScoreData] = useState<ScoreRecordResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"records" | "matches">("records");
  
  // 참여 경기 관련 상태
  const [tournaments, setTournaments] = useState<TournamentResponse[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(false);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [tournamentsError, setTournamentsError] = useState<string | null>(null);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  useEffect(() => {
    fetchScoreData();
  }, []);

  useEffect(() => {
    if (activeTab === "matches") {
      fetchTournaments();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedTournament) {
      fetchMatches(selectedTournament);
    } else {
      setMatches([]);
    }
  }, [selectedTournament]);

  const fetchScoreData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(getApiEndpoint("/api/v1/members/me/score-record"), {
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
        throw new Error("개인기록을 불러오는데 실패했습니다.");
      }

      const data: any = await response.json();
      const isSuccess = data.isSuccess || data.success;
      
      if (isSuccess && data.result) {
        setScoreData(data.result);
      } else {
        throw new Error(data.message || "개인기록을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "개인기록을 불러오는데 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTournaments = async () => {
    setIsLoadingTournaments(true);
    setTournamentsError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(getApiEndpoint("/api/v1/members/me/tournaments"), {
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
        throw new Error("참여한 대회 목록을 불러오는데 실패했습니다.");
      }

      const data: any = await response.json();
      const isSuccess = data.isSuccess || data.success;
      
      if (isSuccess && data.result) {
        setTournaments(data.result);
      } else {
        throw new Error(data.message || "참여한 대회 목록을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setTournamentsError(
        err instanceof Error ? err.message : "참여한 대회 목록을 불러오는데 실패했습니다."
      );
    } finally {
      setIsLoadingTournaments(false);
    }
  };

  const fetchMatches = async (tournamentId: number) => {
    setIsLoadingMatches(true);
    setMatchesError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        getApiEndpoint(`/api/v1/tournaments/${tournamentId}/matches`),
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
        throw new Error("경기 목록을 불러오는데 실패했습니다.");
      }

      const data: any = await response.json();
      const isSuccess = data.isSuccess || data.success;
      
      if (isSuccess && data.result) {
        setMatches(data.result);
      } else {
        throw new Error(data.message || "경기 목록을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setMatchesError(
        err instanceof Error ? err.message : "경기 목록을 불러오는데 실패했습니다."
      );
    } finally {
      setIsLoadingMatches(false);
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
          <h1 className="text-lg font-semibold text-navy">개인기록</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-border">
            <button
              onClick={() => setActiveTab("records")}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === "records"
                  ? "text-navy border-b-2 border-navy"
                  : "text-gray-text"
              }`}
            >
              기록
            </button>
            <button
              onClick={() => setActiveTab("matches")}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === "matches"
                  ? "text-navy border-b-2 border-navy"
                  : "text-gray-text"
              }`}
            >
              참여 경기
            </button>
          </div>
        </div>

        {isLoading ? (
          // Skeleton UI
          <div className="space-y-4">
            <div className="card overflow-hidden">
              <div className="h-12 bg-navy animate-pulse" />
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-gray-bg rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={fetchScoreData}
              className="mt-2 text-sm text-red-600 underline"
            >
              다시 시도
            </button>
          </div>
        ) : scoreData ? (
          activeTab === "records" ? (
            <div className="space-y-4">
              {/* 기본 통계 카드 */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-navy mb-4">기본 통계</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-text mb-1">참여 세트 수</p>
                    <p className="text-2xl font-bold text-navy">
                      {scoreData.setsPlayed || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-text mb-1">총 득점</p>
                    <p className="text-2xl font-bold text-navy">
                      {scoreData.totalScore || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* 득점 상세 */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-navy mb-4">득점 상세</h3>
                {/* 데스크톱: 테이블 */}
                <div className="hidden md:block overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-navy text-white">
                        <th className="px-4 py-3 text-center font-semibold">총 득점</th>
                        <th className="px-4 py-3 text-center font-semibold">공격 득점</th>
                        <th className="px-4 py-3 text-center font-semibold">서브 득점</th>
                        <th className="px-4 py-3 text-center font-semibold">블로킹 득점</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-gray-bg">
                        <td className="px-4 py-4 text-center text-gray-dark font-semibold text-lg">
                          {scoreData.totalScore || 0}
                        </td>
                        <td className="px-4 py-4 text-center text-gray-dark font-semibold text-lg">
                          {scoreData.totalAttackSuccess || 0}
                        </td>
                        <td className="px-4 py-4 text-center text-gray-dark font-semibold text-lg">
                          {scoreData.totalServeAce || 0}
                        </td>
                        <td className="px-4 py-4 text-center text-gray-dark font-semibold text-lg">
                          {scoreData.totalBlockSuccess || 0}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* 모바일: 카드 레이아웃 */}
                <div className="md:hidden grid grid-cols-2 gap-3">
                  <div className="bg-gray-bg p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-text mb-1">총 득점</p>
                    <p className="text-xl font-bold text-navy">{scoreData.totalScore || 0}</p>
                  </div>
                  <div className="bg-gray-bg p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-text mb-1">공격 득점</p>
                    <p className="text-xl font-bold text-navy">{scoreData.totalAttackSuccess || 0}</p>
                  </div>
                  <div className="bg-gray-bg p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-text mb-1">서브 득점</p>
                    <p className="text-xl font-bold text-navy">{scoreData.totalServeAce || 0}</p>
                  </div>
                  <div className="bg-gray-bg p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-text mb-1">블로킹 득점</p>
                    <p className="text-xl font-bold text-navy">{scoreData.totalBlockSuccess || 0}</p>
                  </div>
                </div>
              </div>

              {/* 공격 통계 */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-navy mb-4">공격 통계</h3>
                {/* 데스크톱: 테이블 */}
                <div className="hidden md:block overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-navy text-white">
                        <th className="px-4 py-3 text-center font-semibold">공격 득점</th>
                        <th className="px-4 py-3 text-center font-semibold">공격 성공률</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-gray-bg">
                        <td className="px-4 py-4 text-center text-gray-dark font-semibold text-lg">
                          {scoreData.totalAttackSuccess || 0}
                        </td>
                        <td className="px-4 py-4 text-center text-gray-dark font-semibold text-lg">
                          {scoreData.attackSuccessRate != null 
                            ? `${scoreData.attackSuccessRate.toFixed(1)}%`
                            : "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* 모바일: 카드 레이아웃 */}
                <div className="md:hidden grid grid-cols-2 gap-3">
                  <div className="bg-gray-bg p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-text mb-1">공격 득점</p>
                    <p className="text-xl font-bold text-navy">{scoreData.totalAttackSuccess || 0}</p>
                  </div>
                  <div className="bg-gray-bg p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-text mb-1">공격 성공률</p>
                    <p className="text-xl font-bold text-navy">
                      {scoreData.attackSuccessRate != null 
                        ? `${scoreData.attackSuccessRate.toFixed(1)}%`
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 디그 통계 */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-navy mb-4">디그 통계</h3>
                {/* 데스크톱: 테이블 */}
                <div className="hidden md:block overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-navy text-white">
                        <th className="px-4 py-3 text-center font-semibold">디그 수</th>
                        <th className="px-4 py-3 text-center font-semibold">디그 성공률</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-gray-bg">
                        <td className="px-4 py-4 text-center text-gray-dark font-semibold text-lg">
                          {scoreData.totalDigSuccess || 0}
                        </td>
                        <td className="px-4 py-4 text-center text-gray-dark font-semibold text-lg">
                          {scoreData.digSuccessRate != null 
                            ? `${scoreData.digSuccessRate.toFixed(1)}%`
                            : "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* 모바일: 카드 레이아웃 */}
                <div className="md:hidden grid grid-cols-2 gap-3">
                  <div className="bg-gray-bg p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-text mb-1">디그 수</p>
                    <p className="text-xl font-bold text-navy">{scoreData.totalDigSuccess || 0}</p>
                  </div>
                  <div className="bg-gray-bg p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-text mb-1">디그 성공률</p>
                    <p className="text-xl font-bold text-navy">
                      {scoreData.digSuccessRate != null 
                        ? `${scoreData.digSuccessRate.toFixed(1)}%`
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            // 참여 경기 탭
            <div className="space-y-4">
              {/* 참여한 대회 목록 */}
              <div>
                <h3 className="text-lg font-semibold text-navy mb-4">내가 참여한 대회</h3>
                {isLoadingTournaments ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="card p-4 animate-pulse">
                        <div className="h-5 bg-gray-bg rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : tournamentsError ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{tournamentsError}</p>
                    <button
                      onClick={fetchTournaments}
                      className="mt-2 text-sm text-red-600 underline"
                    >
                      다시 시도
                    </button>
                  </div>
                ) : tournaments.length === 0 ? (
                  <div className="card p-6 text-center">
                    <p className="text-gray-text">참여한 대회가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tournaments.map((tournament) => (
                      <button
                        key={tournament.id}
                        onClick={() => setSelectedTournament(
                          selectedTournament === tournament.id ? null : tournament.id
                        )}
                        className={`card p-4 w-full text-left hover:shadow-card-lg transition-shadow ${
                          selectedTournament === tournament.id
                            ? "border-2 border-navy"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-navy">
                            {tournament.tournamentName}
                          </span>
                          <svg
                            className={`w-5 h-5 text-gray-text transition-transform ${
                              selectedTournament === tournament.id ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 선택된 대회의 경기 목록 */}
              {selectedTournament && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-navy">
                      {tournaments.find((t) => t.id === selectedTournament)?.tournamentName} 경기 목록
                    </h3>
                    <button
                      onClick={() => setSelectedTournament(null)}
                      className="text-sm text-gray-text hover:text-navy"
                    >
                      접기
                    </button>
                  </div>
                  {isLoadingMatches ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="card p-4 animate-pulse">
                          <div className="h-5 bg-gray-bg rounded w-3/4" />
                        </div>
                      ))}
                    </div>
                  ) : matchesError ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{matchesError}</p>
                      <button
                        onClick={() => fetchMatches(selectedTournament)}
                        className="mt-2 text-sm text-red-600 underline"
                      >
                        다시 시도
                      </button>
                    </div>
                  ) : matches.length === 0 ? (
                    <div className="card p-6 text-center">
                      <p className="text-gray-text">등록된 경기가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {matches.map((match) => (
                        <Link
                          key={match.id}
                          href={`/matches/${match.id}`}
                          className="card p-4 hover:shadow-card-lg transition-shadow block"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-navy mb-1">
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
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-600">
              기록 데이터를 불러올 수 없습니다. 다시 시도해주세요.
            </p>
            <button
              onClick={fetchScoreData}
              className="mt-2 text-sm text-yellow-600 underline"
            >
              다시 시도
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

