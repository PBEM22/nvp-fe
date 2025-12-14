"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import type { TournamentCreateRequest } from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 관리자 대회 생성 페이지
 */
export default function CreateTournamentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{
    tournamentName: string;
    isSixPlayer: string;
  }>({
    defaultValues: {
      tournamentName: "",
      isSixPlayer: "false",
    },
  });

  const isSixPlayerValue = watch("isSixPlayer");

  const onSubmit = async (data: { tournamentName: string; isSixPlayer: string }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const requestData: TournamentCreateRequest = {
        tournamentName: data.tournamentName,
        isSixPlayer: data.isSixPlayer === "true",
      };

      const response = await fetch(getApiEndpoint("/api/v1/tournaments"), {
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
        throw new Error(
          errorData.message || "대회 생성에 실패했습니다. 다시 시도해주세요."
        );
      }

      // 성공 시 목록 페이지로 이동
      router.push("/admin/tournaments");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "대회 생성에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
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
          <h1 className="text-lg font-semibold text-navy">대회 생성</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 대회명 */}
          <div className="space-y-2">
            <label
              htmlFor="tournamentName"
              className="block text-sm font-medium text-gray-dark"
            >
              대회명 <span className="text-red-500">*</span>
            </label>
            <input
              id="tournamentName"
              type="text"
              {...register("tournamentName", {
                required: "대회명을 입력해주세요.",
                minLength: {
                  value: 2,
                  message: "대회명은 2자 이상 입력해주세요.",
                },
                maxLength: {
                  value: 100,
                  message: "대회명은 100자 이하로 입력해주세요.",
                },
              })}
              placeholder="대회명을 입력해 주세요."
              className="input w-full"
            />
            {errors.tournamentName && (
              <p className="text-sm text-red-500">
                {errors.tournamentName.message}
              </p>
            )}
          </div>

          {/* 6인제 여부 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-dark mb-3">
              6인제 여부 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  value="true"
                  {...register("isSixPlayer", {
                    required: "6인제 여부를 선택해주세요.",
                  })}
                  className="sr-only"
                />
                <div
                  className={`btn-outline text-center py-3 transition-all ${
                    isSixPlayerValue === "true"
                      ? "bg-navy text-white border-navy"
                      : ""
                  }`}
                >
                  6인제
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  value="false"
                  {...register("isSixPlayer", {
                    required: "6인제 여부를 선택해주세요.",
                  })}
                  className="sr-only"
                />
                <div
                  className={`btn-outline text-center py-3 transition-all ${
                    isSixPlayerValue === "false"
                      ? "bg-navy text-white border-navy"
                      : ""
                  }`}
                >
                  9인제
                </div>
              </label>
            </div>
            {errors.isSixPlayer && (
              <p className="text-sm text-red-500">
                {errors.isSixPlayer.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "생성 중..." : "생성하기"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

