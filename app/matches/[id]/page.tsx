"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type {
  MatchDetailResponse,
} from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 공개 경기 상세 페이지 - 비회원 포함 모든 사용자 접근 가능
 */
export default function PublicMatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params?.id as string;

  const [matchDetail, setMatchDetail] =
    useState<MatchDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (matchId) {
      fetchMatchDetail();
    }
  }, [matchId]);

  const fetchMatchDetail = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        getApiEndpoint(`/api/v1/matches/${matchId}/details`),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("경기 상세 정보를 불러오는데 실패했습니다.");
      }

      const data: any = await response.json();
      if ((data.isSuccess || data.success) && data.result) {
        setMatchDetail(data.result);
      } else {
        throw new Error(
          data.message || "경기 상세 정보를 불러오는데 실패했습니다."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "경기 상세 정보를 불러오는데 실패했습니다."
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

  if (error || !matchDetail) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 py-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              {error || "경기 상세 정보를 불러올 수 없습니다."}
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
          <h1 className="text-lg font-semibold text-navy">경기 상세</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Match Info */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-navy">
              {matchDetail.tournamentName}
            </h2>
            <span
              className={`tag ${
                ((matchDetail as any).win ?? matchDetail.isWin) === true
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {((matchDetail as any).win ?? matchDetail.isWin) === true ? "승" : "패"}
            </span>
          </div>
          <div className="space-y-2 text-sm text-gray-text">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-dark">상대팀:</span>
              <span>{matchDetail.opponentDisplayName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-dark">경기 날짜:</span>
              <span>{formatDate(matchDetail.matchDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-dark">구분:</span>
              <span>{((matchDetail as any).male ?? matchDetail.isMale) ? '남자부' : '여자부'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-dark">스코어:</span>
              <span>
                {matchDetail.teamScore} : {matchDetail.opponentScore}
              </span>
            </div>
          </div>
        </div>

        {/* POG Section */}
        {matchDetail.awards && (
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-navy mb-4">POG</h3>
            <div className="space-y-3">
              {matchDetail.awards.mvp && (
                <div className="p-3 bg-gray-bg rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-dark">MVP</span>
                    <div className="text-sm text-gray-text">
                      {matchDetail.awards.mvp.playerName}
                      {matchDetail.awards.mvp.backNumber && (
                        <span className="ml-2 text-gray-text">#{matchDetail.awards.mvp.backNumber}</span>
                      )}
                    </div>
                  </div>
                  {matchDetail.awards.mvp.reason && (
                    <p className="text-xs text-gray-text mt-1">
                      {matchDetail.awards.mvp.reason}
                    </p>
                  )}
                </div>
              )}
              {matchDetail.awards.bestSpiker && (
                <div className="p-3 bg-gray-bg rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-dark">
                      공격왕
                    </span>
                    <div className="text-sm text-gray-text">
                      {matchDetail.awards.bestSpiker.playerName}
                      {matchDetail.awards.bestSpiker.backNumber && (
                        <span className="ml-2 text-gray-text">#{matchDetail.awards.bestSpiker.backNumber}</span>
                      )}
                    </div>
                  </div>
                  {matchDetail.awards.bestSpiker.reason && (
                    <p className="text-xs text-gray-text mt-1">
                      {matchDetail.awards.bestSpiker.reason}
                    </p>
                  )}
                </div>
              )}
              {matchDetail.awards.bestDefender && (
                <div className="p-3 bg-gray-bg rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-dark">
                      수비왕
                    </span>
                    <div className="text-sm text-gray-text">
                      {matchDetail.awards.bestDefender.playerName}
                      {matchDetail.awards.bestDefender.backNumber && (
                        <span className="ml-2 text-gray-text">#{matchDetail.awards.bestDefender.backNumber}</span>
                      )}
                    </div>
                  </div>
                  {matchDetail.awards.bestDefender.reason && (
                    <p className="text-xs text-gray-text mt-1">
                      {matchDetail.awards.bestDefender.reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Player Stats Section */}
        {matchDetail.playerMatchStats && matchDetail.playerMatchStats.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-navy mb-4">선수 기록</h3>
            
            {/* 데스크톱: 테이블 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-navy text-white text-sm">
                    <th className="px-4 py-2 text-left">이름</th>
                    <th className="px-4 py-2 text-center">득점</th>
                    <th className="px-4 py-2 text-center">공격 성공</th>
                    <th className="px-4 py-2 text-center">서브 득점</th>
                    <th className="px-4 py-2 text-center">블로킹 성공</th>
                    <th className="px-4 py-2 text-center">디그 성공</th>
                  </tr>
                </thead>
                <tbody>
                  {matchDetail.playerMatchStats.map((player, index) => (
                    <tr
                      key={player.memberId || index}
                      className="border-b border-gray-border bg-gray-bg"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-dark">
                        {player.playerName || `#${player.backNumber}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-text">
                        {player.totalScore || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-text">
                        {player.attackSuccess || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-text">
                        {player.serveSuccess || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-text">
                        {player.blockSuccess || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-text">
                        {player.digSuccess || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 모바일: 카드 레이아웃 */}
            <div className="md:hidden space-y-3">
              {matchDetail.playerMatchStats.map((player, index) => (
                <div
                  key={player.memberId || index}
                  className="bg-gray-bg p-4 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-navy">
                      {player.playerName || `#${player.backNumber}`}
                    </h4>
                    <span className="text-lg font-bold text-navy">
                      {player.totalScore || 0}점
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-gray-text mb-1">공격</p>
                      <p className="font-medium text-gray-dark">{player.attackSuccess || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-text mb-1">서브</p>
                      <p className="font-medium text-gray-dark">{player.serveSuccess || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-text mb-1">블로킹</p>
                      <p className="font-medium text-gray-dark">{player.blockSuccess || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-text mb-1">디그</p>
                      <p className="font-medium text-gray-dark">{player.digSuccess || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

