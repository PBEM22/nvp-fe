"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { LoginRequest, LoginResponseWrapper } from "@/types/api";
import { getApiEndpoint, getApiUrl } from "@/app/lib/api";

/**
 * 로그인 페이지
 */
export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginRequest) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(getApiEndpoint("/api/v1/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "로그인에 실패했습니다. 다시 시도해주세요."
        );
      }

      const result: any = await response.json();
      const isSuccess = result.isSuccess || result.success;
      
      if (isSuccess && result.result) {
        // AccessToken을 localStorage에 저장
        localStorage.setItem("accessToken", result.result.accessToken);
        
        // roles도 저장 (LoginResponse에 roles 필드가 있음)
        if (result.result.roles) {
          localStorage.setItem("userRoles", JSON.stringify(result.result.roles));
        }
        
        // memberId도 저장 (있는 경우)
        if (result.result.memberId) {
          localStorage.setItem("memberId", result.result.memberId.toString());
        }

        // 메인 페이지로 이동
        window.location.href = "/";
      } else {
        throw new Error(result.message || "로그인에 실패했습니다.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "로그인에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Back Button */}
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
          <h1 className="text-lg font-semibold text-navy">로그인</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center px-4 py-12 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md">
          {/* Main Logo Section */}
          <div className="flex flex-col items-center mb-12">
            <div className="w-24 h-24 mb-4 relative">
              <Image
                src="/logo.png"
                alt="NVP 로고"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-navy mb-2">NVP</h1>
            <p className="text-blue text-sm">Namseoul Volleyball Potential</p>
          </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 아이디 */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-dark"
            >
              아이디
            </label>
            <input
              id="email"
              type="email"
              {...register("email", {
                required: "아이디를 입력해주세요.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "올바른 이메일 형식을 입력해주세요.",
                },
              })}
              placeholder="아이디를 입력해 주세요."
              className="input w-full"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-dark"
            >
              비밀번호
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password", {
                  required: "비밀번호를 입력해주세요.",
                })}
                placeholder="비밀번호를 입력해 주세요."
                className="input-icon w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text hover:text-gray-dark"
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showPassword ? (
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
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 3m3.29 3.29L3 3"
                    />
                  </svg>
                ) : (
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Action Links */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Link
                href="/find-id"
                className="text-gray-text hover:text-navy transition-colors"
              >
                아이디 찾기
              </Link>
              <span className="text-gray-border">|</span>
              <Link
                href="/find-password"
                className="text-gray-text hover:text-navy transition-colors"
              >
                비밀번호 찾기
              </Link>
            </div>
            <Link
              href="/signup"
              className="text-gray-text hover:text-navy transition-colors"
            >
              회원가입
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* Social Login */}
        <div className="mt-8">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-border"></div>
            </div>
            <span className="relative bg-white px-4 text-sm text-gray-text">
              또는
            </span>
          </div>

          <div className="flex gap-4 justify-center">
            {/* Kakao Login */}
            <button
              type="button"
              onClick={() => {
                // 백엔드 주소는 getApiUrl()을 통해 중앙 관리
                const backendUrl = getApiUrl();
                window.location.href = `${backendUrl}/oauth2/authorization/kakao`;
              }}
              className="w-14 h-14 rounded-full bg-[#FEE500] flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
              aria-label="카카오 로그인"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 3C6.477 3 2 6.477 2 11c0 2.558 1.58 4.83 4 6.16l-1.05 3.95 4.2-2.8c.5.05 1 .1 1.5.1 5.523 0 10-3.477 10-8s-4.477-8-10-8z"
                  fill="#000000"
                />
              </svg>
            </button>

            {/* Google Login */}
            <button
              type="button"
              onClick={() => {
                alert("구글 로그인은 준비 중입니다.");
              }}
              className="w-14 h-14 rounded-full bg-white border-2 border-gray-border flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
              aria-label="구글 로그인"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

