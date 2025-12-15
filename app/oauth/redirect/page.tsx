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

      console.log("OAuth redirect: 토큰 추출", {
        hasToken: !!token,
        tokenLength: token?.length,
        fullUrl: window.location.href,
      });

      if (!token) {
        console.error("OAuth redirect: 토큰이 없습니다. URL:", window.location.href);
        setError("로그인 정보를 불러올 수 없습니다. (토큰 없음)");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
        return;
      }

      // 토큰 디코딩 (URL 인코딩된 경우 대비)
      // decodeURIComponent는 이미 디코딩된 문자열에 대해 원본을 반환하므로 안전합니다
      let decodedToken: string;
      try {
        decodedToken = decodeURIComponent(token);
      } catch (e) {
        // 디코딩 실패 시 원본 사용 (이미 디코딩된 경우)
        decodedToken = token;
      }
      
      console.log("OAuth redirect: 토큰 처리 완료", {
        originalLength: token.length,
        decodedLength: decodedToken.length,
        tokenPrefix: decodedToken.substring(0, 50),
        tokenParts: decodedToken.split('.').length, // JWT는 3부분으로 구성
        isJWTFormat: decodedToken.split('.').length === 3,
      });

      try {
        // AccessToken을 localStorage에 저장
        localStorage.setItem("accessToken", decodedToken);
        
        // AccessToken을 쿠키에도 저장 (7일 유효)
        setCookie("accessToken", decodedToken, 7);

        // /api/v1/members/me API를 호출하여 역할 및 사용자 정보 가져오기
        const apiUrl = getApiEndpoint("/api/v1/members/me");
        console.log("OAuth redirect: API 호출 시도", {
          apiUrl,
          tokenLength: decodedToken.length,
          tokenPrefix: decodedToken.substring(0, 20) + "...",
        });

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${decodedToken}`,
          },
        });

        console.log("OAuth redirect: API 응답", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (!response.ok) {
          if (response.status === 401) {
            const errorData = await response.json().catch(() => ({}));
            console.error("OAuth redirect: 401 인증 실패", {
              status: response.status,
              errorData,
              tokenUsed: decodedToken.substring(0, 30) + "...",
            });
            localStorage.removeItem("accessToken");
            setError("로그인 정보를 불러올 수 없습니다. (인증 실패)");
            setTimeout(() => {
              router.push("/login");
            }, 2000);
            return;
          }
          const errorText = await response.text().catch(() => "");
          console.error("OAuth redirect: API 호출 실패 (non-200)", {
            status: response.status,
            statusText: response.statusText,
            url: apiUrl,
            error: errorText.substring(0, 500), // 처음 500자만
          });
          throw new Error(`사용자 정보를 불러오는데 실패했습니다. (${response.status})`);
        }

        // 응답 본문을 먼저 텍스트로 읽기
        const responseText = await response.text();
        console.log("OAuth redirect: API 응답 본문 (raw)", {
          status: response.status,
          responseLength: responseText.length,
          responsePreview: responseText.substring(0, 500), // 처음 500자만
        });

        // JSON 파싱 시도
        let data: any;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("OAuth redirect: JSON 파싱 실패", {
            responseText: responseText.substring(0, 1000),
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
          });
          throw new Error("서버 응답을 파싱할 수 없습니다. (JSON 형식 아님)");
        }

        // 응답 구조 확인
        console.log("OAuth redirect: API 응답 데이터 (parsed)", {
          hasIsSuccess: "isSuccess" in data,
          hasSuccess: "success" in data,
          isSuccess: data.isSuccess,
          success: data.success,
          hasResult: !!data.result,
          hasMessage: !!data.message,
          hasCode: !!data.code,
          message: data.message,
          code: data.code,
          dataKeys: Object.keys(data),
        });

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
          console.error("OAuth redirect: API 응답 실패", {
            data,
            isSuccess,
            hasResult: !!data.result,
            message: data.message,
          });
          throw new Error(data.message || "사용자 정보를 불러오는데 실패했습니다.");
        }
      } catch (err) {
        console.error("OAuth redirect error:", {
          error: err,
          errorMessage: err instanceof Error ? err.message : String(err),
          tokenWasPresent: !!token,
        });
        setError(`로그인 정보를 불러올 수 없습니다. (${err instanceof Error ? err.message : "알 수 없는 오류"})`);
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
