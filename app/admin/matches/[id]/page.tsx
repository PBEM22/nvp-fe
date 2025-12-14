"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type {
  MatchDetailResponse,
  MatchPlayerSummaryResponse,
  MemberDetailResponse,
  MemberListResponse,
} from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 관리자 경기 상세 페이지
 */
export default function MatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params?.id as string;

  const [matchDetail, setMatchDetail] =
    useState<MatchDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 기록 업로드 모달 상태
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberDetailResponse[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // 업로드 폼 상태
  const [uploadForm, setUploadForm] = useState({
    isWin: true,
    teamScore: "",
    opponentScore: "",
    mvpMemberId: "",
    spikerMemberId: "",
    defenderMemberId: "",
    file: null as File | null,
  });

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

  // 멤버 목록 가져오기
  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(
        getApiEndpoint(`/api/admin/members?page=0&size=1000&sort=name,asc`),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data: MemberListResponse = await response.json();
        if ((data.isSuccess || (data as any).success) && data.result) {
          // MemberSummaryResponse를 MemberDetailResponse 형식으로 변환
          const memberDetails = data.result.content.map((member) => ({
            memberId: member.memberId,
            userId: member.userId,
            email: member.email,
            name: member.name,
            membershipStatus: member.membershipStatus,
          })) as MemberDetailResponse[];
          setMembers(memberDetails);
        }
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // 템플릿 다운로드
  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch(
        getApiEndpoint("/api/v1/matches/records/template"),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("템플릿 다운로드에 실패했습니다.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "경기기록_템플릿.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "템플릿 다운로드에 실패했습니다.");
    }
  };

  // 기록 업로드
  const handleUploadRecords = async () => {
    if (!uploadForm.file) {
      setUploadError("파일을 선택해주세요.");
      return;
    }

    if (!uploadForm.teamScore || !uploadForm.opponentScore) {
      setUploadError("스코어를 입력해주세요.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const formData = new FormData();
      formData.append("file", uploadForm.file);

      const queryParams = new URLSearchParams({
        isWin: uploadForm.isWin.toString(),
        teamScore: uploadForm.teamScore,
        opponentScore: uploadForm.opponentScore,
      });

      if (uploadForm.mvpMemberId) {
        queryParams.append("mvpMemberId", uploadForm.mvpMemberId);
      }
      if (uploadForm.spikerMemberId) {
        queryParams.append("spikerMemberId", uploadForm.spikerMemberId);
      }
      if (uploadForm.defenderMemberId) {
        queryParams.append("defenderMemberId", uploadForm.defenderMemberId);
      }

      const response = await fetch(
        getApiEndpoint(`/api/v1/matches/${matchId}/records/upload?${queryParams.toString()}`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "기록 업로드에 실패했습니다.");
      }

      // 성공 시 모달 닫고 경기 상세 정보 다시 불러오기
      setIsUploadModalOpen(false);
      setUploadForm({
        isWin: true,
        teamScore: "",
        opponentScore: "",
        mvpMemberId: "",
        spikerMemberId: "",
        defenderMemberId: "",
        file: null,
      });
      fetchMatchDetail();
      alert("기록이 성공적으로 업로드되었습니다.");
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "기록 업로드에 실패했습니다."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // 업로드 모달 열 때 멤버 목록 가져오기
  useEffect(() => {
    if (isUploadModalOpen) {
      fetchMembers();
    }
  }, [isUploadModalOpen]);

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
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn-outline text-red-600 border-red-600 hover:bg-red-50"
            style={{ width: "auto", padding: "8px 16px" }}
          >
            삭제
          </button>
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

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="btn-primary flex-1"
          >
            기록 업로드
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="btn-outline flex-1"
          >
            템플릿 다운로드
          </button>
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
                      {matchDetail.awards.mvp.playerName || (matchDetail.awards.mvp as any).memberName}
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
                      {matchDetail.awards.bestSpiker.playerName || (matchDetail.awards.bestSpiker as any).memberName}
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
                      {matchDetail.awards.bestDefender.playerName || (matchDetail.awards.bestDefender as any).memberName}
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

        {/* 기록 업로드 모달 */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-navy">기록 업로드</h2>
                  <button
                    onClick={() => setIsUploadModalOpen(false)}
                    className="text-gray-text hover:text-navy"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {uploadError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{uploadError}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* 템플릿 다운로드 버튼 */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleDownloadTemplate}
                      className="text-sm text-navy hover:underline"
                    >
                      템플릿 다운로드
                    </button>
                  </div>

                  {/* 파일 업로드 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      경기 기록 파일 (XLSX)
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          file: e.target.files?.[0] || null,
                        })
                      }
                      className="input w-full"
                    />
                  </div>

                  {/* 승패 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      승패
                    </label>
                    <select
                      value={uploadForm.isWin ? "true" : "false"}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          isWin: e.target.value === "true",
                        })
                      }
                      className="select-custom w-full"
                    >
                      <option value="true">승</option>
                      <option value="false">패</option>
                    </select>
                  </div>

                  {/* 스코어 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-1">
                        우리 팀 세트 스코어
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={uploadForm.teamScore}
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            teamScore: e.target.value,
                          })
                        }
                        className="input w-full"
                        placeholder="3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-1">
                        상대 팀 세트 스코어
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={uploadForm.opponentScore}
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            opponentScore: e.target.value,
                          })
                        }
                        className="input w-full"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  {/* MVP 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      MVP (선택)
                    </label>
                    <select
                      value={uploadForm.mvpMemberId}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          mvpMemberId: e.target.value,
                        })
                      }
                      className="select-custom w-full"
                      disabled={isLoadingMembers}
                    >
                      <option value="">선택 안함</option>
                      {members.map((member) => (
                        <option key={member.memberId} value={member.memberId}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 공격왕 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      공격왕 (선택)
                    </label>
                    <select
                      value={uploadForm.spikerMemberId}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          spikerMemberId: e.target.value,
                        })
                      }
                      className="select-custom w-full"
                      disabled={isLoadingMembers}
                    >
                      <option value="">선택 안함</option>
                      {members.map((member) => (
                        <option key={member.memberId} value={member.memberId}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 수비왕 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      수비왕 (선택)
                    </label>
                    <select
                      value={uploadForm.defenderMemberId}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          defenderMemberId: e.target.value,
                        })
                      }
                      className="select-custom w-full"
                      disabled={isLoadingMembers}
                    >
                      <option value="">선택 안함</option>
                      {members.map((member) => (
                        <option key={member.memberId} value={member.memberId}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setIsUploadModalOpen(false)}
                      className="btn-outline flex-1"
                      disabled={isUploading}
                    >
                      취소
                    </button>
                    <button
                      onClick={handleUploadRecords}
                      className="btn-primary flex-1"
                      disabled={isUploading}
                    >
                      {isUploading ? "업로드 중..." : "업로드"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-navy mb-4">경기 삭제</h2>
              <p className="text-gray-text mb-6">
                정말로 이 경기를 삭제하시겠습니까?<br />
                경기 기록과 선수 기록도 함께 삭제됩니다.<br />
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
                        getApiEndpoint(`/api/v1/matches/${matchId}`),
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
                        throw new Error(errorData.message || "경기 삭제에 실패했습니다.");
                      }

                      // 삭제 성공 시 대회 목록으로 이동
                      router.push("/admin/tournaments");
                    } catch (err) {
                      setError(
                        err instanceof Error ? err.message : "경기 삭제에 실패했습니다."
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

