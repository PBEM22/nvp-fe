"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { MemberDetailResponse, MemberDetailResponseWrapper } from "@/types/api";
import { getApiEndpoint } from "@/app/lib/api";

/**
 * 쿠키에 값을 저장하는 유틸리티 함수
 */
function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * OAuth 리다이렉트 콘텐츠 컴포넌트
 * 카카오 로그인 후 백엔드에서 리다이렉트된 토큰을 처리
 */
function OAuthRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthRedirect = async () => {
      // URL 쿼리 파라미터에서 token 추출
      const token = searchParams.get("token");

      if (!token) {
        setError("로그인 정보를 불러올 수 없습니다.");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
        return;
      }

      try {
        // AccessToken을 localStorage에 저장
        localStorage.setItem("accessToken", token);
        
        // AccessToken을 쿠키에도 저장 (7일 유효)
        setCookie("accessToken", token, 7);

        // /api/v1/members/me API를 호출하여 역할 및 사용자 정보 가져오기
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
            setError("로그인 정보를 불러올 수 없습니다.");
            setTimeout(() => {
              router.push("/login");
            }, 2000);
            return;
          }
          throw new Error("사용자 정보를 불러오는데 실패했습니다.");
        }

        const data: any = await response.json();
        const isSuccess = data.isSuccess || data.success;
        
        if (isSuccess && data.result) {
          const memberData = data.result as MemberDetailResponse & { roles?: string[] };
          
          // memberId 저장
          if (memberData.memberId) {
            localStorage.setItem("memberId", memberData.memberId.toString());
          }

          // 사용자 정보 저장
          localStorage.setItem("userInfo", JSON.stringify(memberData));

          // 역할 추출 (백엔드 응답에 roles가 포함되어 있다고 가정)
          const roles: string[] = memberData.roles || [];
          localStorage.setItem("userRoles", JSON.stringify(roles));

          // 역할에 따라 리다이렉트
          const hasManagerRole = roles.some(
            (role: string) => role === "ROLE_MANAGER" || role.includes("MANAGER")
          );
          
          if (hasManagerRole) {
            router.push("/admin");
          } else {
            router.push("/");
          }
        } else {
          throw new Error(data.message || "사용자 정보를 불러오는데 실패했습니다.");
        }
      } catch (err) {
        console.error("OAuth redirect error:", err);
        setError("로그인 정보를 불러올 수 없습니다.");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    };

    handleOAuthRedirect();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="text-center">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
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
            </div>
            <p className="text-gray-dark mb-2">{error}</p>
            <p className="text-sm text-gray-text">로그인 페이지로 이동합니다...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-blue-light rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
              <svg
                className="w-8 h-8 text-navy"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <p className="text-gray-dark mb-2">로그인 처리 중...</p>
            <p className="text-sm text-gray-text">잠시만 기다려주세요</p>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * OAuth 리다이렉트 페이지
 * 
 * 백엔드에서 http://localhost:3000/oauth/redirect?token=xxxx 형태로 리다이렉트
 * URL 쿼리 파라미터에서 token을 추출하여 localStorage에 저장하고 메인 페이지로 이동
 */
export default function OAuthRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-light rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
              <svg
                className="w-8 h-8 text-navy"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <p className="text-gray-dark mb-2">로딩 중...</p>
          </div>
        </div>
      }
    >
      <OAuthRedirectContent />
    </Suspense>
  );
}
