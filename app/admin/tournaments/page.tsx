"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { TournamentResponse, TournamentListResponse } from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 관리자 대회 목록 페이지
 */
export default function TournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<TournamentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (deleteTargetId === null) return;
    
    setIsDeleting(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        getApiEndpoint(`/api/v1/tournaments/${deleteTargetId}`),
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

      // 삭제 성공 시 목록 새로고침
      setDeleteTargetId(null);
      fetchTournaments();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "대회 삭제에 실패했습니다."
      );
    } finally {
      setIsDeleting(false);
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
          <h1 className="text-lg font-semibold text-navy">대회 목록</h1>
          <Link
            href="/admin/tournaments/create"
            className="btn-primary"
            style={{ width: "auto", padding: "8px 16px" }}
          >
            대회 추가
          </Link>
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
            <p className="text-sm text-gray-text">새로운 대회를 생성해보세요</p>
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
              {tournaments.map((tournament) => {
                const dDay = calculateDDay(); // 날짜 정보가 없으므로 null 반환
                return (
                  <div
                    key={tournament.id}
                    className="card p-4 hover:shadow-card-lg transition-shadow relative"
                  >
                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetId(tournament.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="삭제"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                    <Link
                      href={`/admin/tournaments/${tournament.id}`}
                      className="block"
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
                      {/* 기간과 장소는 API에 없으므로 주석 처리
                      <div className="text-xs text-gray-text">
                        2025.12.12 ~ 12.14
                      </div>
                      <div className="text-xs text-gray-text">
                        서울대학교 체육관
                      </div>
                      */}
                    </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <Link
        href="/admin/tournaments/create"
        className="fixed bottom-6 right-6 z-20 flex items-center justify-center w-14 h-14 bg-navy text-white rounded-full shadow-lg hover:bg-navy-600 transition-all hover:scale-110"
        aria-label="대회 생성하기"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      </Link>

      {/* 삭제 확인 모달 */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-navy mb-4">대회 삭제</h2>
              <p className="text-gray-text mb-6">
                정말로 이 대회를 삭제하시겠습니까?<br />
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
                    setDeleteTargetId(null);
                    setError(null);
                  }}
                  className="btn-outline flex-1"
                  disabled={isDeleting}
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
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

