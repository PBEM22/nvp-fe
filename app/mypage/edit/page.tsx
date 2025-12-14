"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type {
  MemberDetailResponse,
  UpdateMyInfoRequest,
} from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";
import { Gender } from "@/types/api";

/**
 * 회원정보 수정 페이지
 */
export default function EditMyInfoPage() {
  const router = useRouter();
  const [memberData, setMemberData] = useState<MemberDetailResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<UpdateMyInfoRequest>();

  useEffect(() => {
    fetchMemberData();
  }, []);

  const fetchMemberData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(getApiEndpoint("/api/v1/members/me"), {
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
        throw new Error("회원 정보를 불러오는데 실패했습니다.");
      }

      const data: any = await response.json();
      const isSuccess = data.isSuccess || data.success;

      if (isSuccess && data.result) {
        setMemberData(data.result);
        
        // 디버깅: isMale/male 값 확인
        const isMale = data.result.isMale !== undefined 
          ? (data.result.isMale === true || data.result.isMale === "true")
          : (data.result.male === true || data.result.male === "true");
        
        // 폼에 초기값 설정
        const genderValue = isMale ? Gender.MALE : Gender.FEMALE;
        
        setValue("name", data.result.name || "");
        setValue("birthday", data.result.birthday || "");
        setValue("gender", genderValue);
        setValue("major", data.result.major || "");
        setValue("isPublic", data.result.isPublic ?? true);
      } else {
        throw new Error(data.message || "회원 정보를 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "회원 정보를 불러오는데 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: UpdateMyInfoRequest) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(getApiEndpoint("/api/v1/members/me"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("memberId");
          router.push("/login");
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || "회원 정보 수정에 실패했습니다.");
      }

      const result: any = await response.json();
      const isSuccess = result.isSuccess || result.success;

      if (isSuccess) {
        setSuccess(true);
        // 성공 후 마이페이지로 이동
        setTimeout(() => {
          router.push("/mypage");
        }, 1500);
      } else {
        throw new Error(result.message || "회원 정보 수정에 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "회원 정보 수정에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-navy text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 -ml-2 text-white hover:bg-white/20 rounded-lg transition-colors"
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
            <span className="font-semibold text-lg">회원정보 수정</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-bg rounded w-20 animate-pulse" />
                <div className="h-12 bg-gray-bg rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">
                  회원 정보가 성공적으로 수정되었습니다.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 이름 */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-dark">
                이름
              </label>
              <input
                id="name"
                type="text"
                {...register("name", {
                  required: "이름을 입력해주세요.",
                  minLength: {
                    value: 2,
                    message: "이름은 2자 이상이어야 합니다.",
                  },
                })}
                className="input w-full"
                placeholder="이름을 입력하세요"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* 생년월일 */}
            <div className="space-y-2">
              <label
                htmlFor="birthday"
                className="text-sm font-medium text-gray-dark"
              >
                생년월일
              </label>
              <input
                id="birthday"
                type="date"
                {...register("birthday", {
                  required: "생년월일을 입력해주세요.",
                })}
                className="input w-full"
              />
              {errors.birthday && (
                <p className="text-xs text-red-500">{errors.birthday.message}</p>
              )}
            </div>

            {/* 성별 */}
            <div className="space-y-2">
              <label
                htmlFor="gender"
                className="text-sm font-medium text-gray-dark"
              >
                성별
              </label>
              <select
                id="gender"
                {...register("gender", {
                  required: "성별을 선택해주세요.",
                })}
                className="select-custom w-full"
              >
                <option value="">성별을 선택하세요</option>
                <option value={Gender.MALE}>남성</option>
                <option value={Gender.FEMALE}>여성</option>
              </select>
              {errors.gender && (
                <p className="text-xs text-red-500">{errors.gender.message}</p>
              )}
            </div>

            {/* 학과 */}
            <div className="space-y-2">
              <label htmlFor="major" className="text-sm font-medium text-gray-dark">
                학과
              </label>
              <input
                id="major"
                type="text"
                {...register("major", {
                  required: "학과를 입력해주세요.",
                })}
                className="input w-full"
                placeholder="학과를 입력하세요"
              />
              {errors.major && (
                <p className="text-xs text-red-500">{errors.major.message}</p>
              )}
            </div>

            {/* 활동 내역 공개 여부 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-dark">
                활동 내역 공개 설정
              </label>
              <div className="flex items-center gap-3 p-4 bg-gray-bg rounded-lg">
                <input
                  id="isPublic"
                  type="checkbox"
                  {...register("isPublic")}
                  className="w-5 h-5 text-navy border-gray-border rounded focus:ring-navy focus:ring-2"
                />
                <label
                  htmlFor="isPublic"
                  className="text-sm text-gray-text cursor-pointer flex-1"
                >
                  활동 내역(기수별 직책 등)을 다른 회원들에게 공개합니다
                </label>
              </div>
              <p className="text-xs text-gray-text">
                체크 해제 시 활동 내역이 공개되지 않습니다.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "수정 중..." : "수정하기"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

