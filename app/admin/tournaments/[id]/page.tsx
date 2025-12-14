"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type { TournamentResponse, MemberMatchResponse } from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 관리자 대회 상세 페이지 (경기 목록 포함)
 */
export default function TournamentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params?.id as string;

  const [tournament, setTournament] = useState<TournamentResponse | null>(null);
  const [matches, setMatches] = useState<MemberMatchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentDetail();
      fetchMatches();
    }
  }, [tournamentId]);

  // 페이지 포커스 시 경기 목록 새로고침 (경기 추가 후 리다이렉트 대응)
  useEffect(() => {
    const handleFocus = () => {
      if (tournamentId) {
        fetchMatches();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [tournamentId]);

  // URL 쿼리 파라미터로 새로고침 요청 감지
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('refresh') === 'true' && tournamentId) {
      // 약간의 지연을 두고 경기 목록을 다시 가져옴 (백엔드 처리 시간 고려)
      setTimeout(() => {
        fetchMatches();
      }, 500);
      // 쿼리 파라미터 제거
      window.history.replaceState({}, '', window.location.pathname);
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
      const token = localStorage.getItem("accessToken");
      
      // 해당 대회의 경기 목록 가져오기
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        getApiEndpoint(`/api/v1/tournaments/${tournamentId}/matches`),
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        if (response.status === 401 && token) {
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
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn-outline text-red-600 border-red-600 hover:bg-red-50"
              style={{ width: "auto", padding: "8px 16px" }}
            >
              삭제
            </button>
            <Link
              href={`/admin/matches/create?tournamentId=${tournamentId}`}
              className="btn-primary"
              style={{ width: "auto", padding: "8px 16px" }}
            >
              경기 추가
            </Link>
          </div>
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
            <Link
              href={`/admin/matches/create?tournamentId=${tournamentId}`}
              className="btn-primary mt-4"
              style={{ width: "auto", padding: "8px 16px" }}
            >
              경기 추가하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <Link
                key={match.matchId}
                href={`/admin/matches/${match.matchId}`}
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
            ))}
          </div>
        )}
      </main>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-navy mb-4">대회 삭제</h2>
              <p className="text-gray-text mb-6">
                정말로 이 대회를 삭제하시겠습니까?<br />
                대회에 속한 모든 경기도 함께 삭제됩니다.<br />
                이 작업은 되돌릴 수 없습니다.
              </p>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setError(null);
                  }}
                  className="btn-outline flex-1"
                  disabled={isDeleting}
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    setIsDeleting(true);
                    setError(null);

                    try {
                      const token = localStorage.getItem("accessToken");
                      if (!token) {
                        router.push("/login");
                        return;
                      }

                      const response = await fetch(
                        getApiEndpoint(`/api/v1/tournaments/${tournamentId}`),
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
                        throw new Error(errorData.message || "대회 삭제에 실패했습니다.");
                      }

                      // 삭제 성공 시 대회 목록으로 이동
                      router.push("/admin/tournaments");
                    } catch (err) {
                      setError(
                        err instanceof Error ? err.message : "대회 삭제에 실패했습니다."
                      );
                      setIsDeleting(false);
                    }
                  }}
                  className="btn-primary flex-1 bg-red-600 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? "삭제 중..." : "삭제"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

