"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  OpponentSchoolResponse,
  OpponentSchoolCreateRequest,
} from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 상대 학교 관리 페이지
 */
export default function OpponentSchoolsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<OpponentSchoolResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 생성 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // 삭제 모달 상태
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OpponentSchoolCreateRequest>({
    schoolName: "",
    teamName: "",
    schoolLogoUrl: "",
  });

  useEffect(() => {
    fetchSchools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSchools = async () => {
    setIsLoading(true);
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
        setSchools(data.result);
      } else {
        throw new Error(data.message || "상대 학교 목록을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "상대 학교 목록을 불러오는데 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      // 필수 필드 검증
      if (!formData.schoolName.trim() || !formData.teamName.trim()) {
        setCreateError("학교 이름과 팀 이름을 모두 입력해주세요.");
        setIsSubmitting(false);
        return;
      }

      const requestData: OpponentSchoolCreateRequest = {
        schoolName: formData.schoolName.trim(),
        teamName: formData.teamName.trim(),
        schoolLogoUrl: formData.schoolLogoUrl?.trim() || undefined,
      };

      const response = await fetch(getApiEndpoint("/api/v1/opponent-schools"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("memberId");
          router.push("/login");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "상대 학교 생성에 실패했습니다.");
      }

      const result: any = await response.json();
      const isSuccess = result.isSuccess || result.success;

      if (isSuccess) {
        // 성공 시 모달 닫고 목록 새로고침
        setShowCreateModal(false);
        setFormData({
          schoolName: "",
          teamName: "",
          schoolLogoUrl: "",
        });
        fetchSchools();
      } else {
        throw new Error(result.message || "상대 학교 생성에 실패했습니다.");
      }
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "상대 학교 생성에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteTargetId === null) return;
    
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        getApiEndpoint(`/api/v1/opponent-schools/${deleteTargetId}`),
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
        throw new Error(errorData.message || "상대 학교 삭제에 실패했습니다.");
      }

      // 삭제 성공 시 목록 새로고침
      setDeleteTargetId(null);
      fetchSchools();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "상대 학교 삭제에 실패했습니다."
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
          <h1 className="text-lg font-semibold text-navy">상대 학교 관리</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            style={{ width: "auto", padding: "8px 16px" }}
          >
            상대팀 추가
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
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
              onClick={fetchSchools}
              className="mt-2 text-sm text-red-600 underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && schools.length === 0 && (
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <p className="text-gray-text mb-2">등록된 상대 학교가 없습니다</p>
            <p className="text-sm text-gray-text">새로운 상대 학교를 추가해보세요</p>
          </div>
        )}

        {/* School List */}
        {!isLoading && !error && schools.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-text">
                전체 {schools.length}개
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {schools.map((school) => (
                <div
                  key={school.id}
                  className="card p-4 relative"
                >
                  {/* 삭제 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTargetId(school.id);
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
                  {/* Logo/Avatar Area */}
                  <div className="flex items-center justify-center w-full aspect-square bg-gray-bg rounded-lg mb-3 overflow-hidden">
                    {school.schoolLogoUrl ? (
                      <img
                        src={school.schoolLogoUrl}
                        alt={school.schoolName}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // 이미지 로드 실패 시 기본 아이콘 표시
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'w-16 h-16 bg-gray-bg rounded-lg flex items-center justify-center fallback-icon';
                            fallback.innerHTML = '<span class="text-2xl">🏫</span>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-bg rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🏫</span>
                      </div>
                    )}
                  </div>

                  {/* School Name */}
                  <h3 className="font-semibold text-navy mb-1 line-clamp-2 text-center text-sm">
                    {school.schoolName}
                  </h3>

                  {/* Team Name */}
                  <p className="text-xs text-gray-text text-center line-clamp-1">
                    {school.teamName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-navy">상대 학교 추가</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                    setFormData({
                      schoolName: "",
                      teamName: "",
                      schoolLogoUrl: "",
                    });
                  }}
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

              {createError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{createError}</p>
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                {/* 학교 이름 */}
                <div>
                  <label
                    htmlFor="schoolName"
                    className="block text-sm font-medium text-gray-dark mb-1"
                  >
                    학교 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="schoolName"
                    type="text"
                    value={formData.schoolName}
                    onChange={(e) =>
                      setFormData({ ...formData, schoolName: e.target.value })
                    }
                    placeholder="예: 서울대학교"
                    className="input w-full"
                    required
                  />
                </div>

                {/* 팀 이름 */}
                <div>
                  <label
                    htmlFor="teamName"
                    className="block text-sm font-medium text-gray-dark mb-1"
                  >
                    팀 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="teamName"
                    type="text"
                    value={formData.teamName}
                    onChange={(e) =>
                      setFormData({ ...formData, teamName: e.target.value })
                    }
                    placeholder="예: 배구부"
                    className="input w-full"
                    required
                  />
                </div>

                {/* 로고 URL */}
                <div>
                  <label
                    htmlFor="schoolLogoUrl"
                    className="block text-sm font-medium text-gray-dark mb-1"
                  >
                    로고 이미지 URL <span className="text-gray-text">(선택)</span>
                  </label>
                  <input
                    id="schoolLogoUrl"
                    type="url"
                    value={formData.schoolLogoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, schoolLogoUrl: e.target.value })
                    }
                    placeholder="https://example.com/logo.png"
                    className="input w-full"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateError(null);
                      setFormData({
                        schoolName: "",
                        teamName: "",
                        schoolLogoUrl: "",
                      });
                    }}
                    className="btn-outline flex-1"
                    disabled={isSubmitting}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "생성 중..." : "생성"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 z-20 flex items-center justify-center w-14 h-14 bg-navy text-white rounded-full shadow-lg hover:bg-navy-600 transition-all hover:scale-110"
        aria-label="상대 학교 추가하기"
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
      </button>

      {/* 삭제 확인 모달 */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-navy mb-4">상대 학교 삭제</h2>
              <p className="text-gray-text mb-6">
                정말로 이 상대 학교를 삭제하시겠습니까?<br />
                이 작업은 되돌릴 수 없습니다.
              </p>
              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{deleteError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeleteTargetId(null);
                    setDeleteError(null);
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
