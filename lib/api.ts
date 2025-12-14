/**
 * API 관련 유틸리티 함수
 */

/**
 * 백엔드 API 기본 URL을 반환합니다.
 * 환경 변수 NEXT_PUBLIC_API_URL이 설정되어 있으면 사용하고,
 * 없으면 기본값으로 http://localhost:8080을 사용합니다.
 */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
}

/**
 * API 엔드포인트의 전체 URL을 생성합니다.
 * @param endpoint API 엔드포인트 (예: "/api/v1/members/me")
 * @returns 전체 URL (예: "http://localhost:8080/api/v1/members/me")
 */
export function getApiEndpoint(endpoint: string): string {
  const baseUrl = getApiUrl();
  // endpoint가 이미 전체 URL인 경우 그대로 반환
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  // endpoint가 /로 시작하지 않으면 추가
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
}

