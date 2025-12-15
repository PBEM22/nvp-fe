"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { SignupRequest, EmailCheckResponseWrapper } from "@/types/api";
import { Gender } from "@/types/api";
import { getApiEndpoint, getApiUrl } from "@/app/lib/api";

/**
 * 회원가입 페이지
 */
export default function SignupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
  } | null>(null);
  const [isDomainDirect, setIsDomainDirect] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<{
    emailLocal: string;
    emailDomain: string;
    emailDomainDirect: string;
    verificationCode: string;
    password: string;
    confirmPassword: string;
    name: string;
    gender: Gender;
    birthday: string;
  }>({
    defaultValues: {
      emailLocal: "",
      emailDomain: "naver.com",
      emailDomainDirect: "",
      verificationCode: "",
      password: "",
      confirmPassword: "",
      name: "",
      gender: Gender.MALE,
      birthday: "",
    },
  });

  const password = watch("password");
  const emailLocal = watch("emailLocal");
  const emailDomain = watch("emailDomain");
  const emailDomainDirect = watch("emailDomainDirect");
  const gender = watch("gender");

  // 이메일 조합
  const combinedEmail = isDomainDirect 
    ? `${emailLocal}@${emailDomainDirect}`
    : `${emailLocal}@${emailDomain}`;

  // 중복확인에 사용된 이메일 저장
  const [checkedEmail, setCheckedEmail] = useState<string | null>(null);

  // 이메일이 변경되었는지 확인
  const isEmailChanged = checkedEmail !== null && combinedEmail !== checkedEmail;

  // 이메일 변경 시 중복확인 결과 초기화
  useEffect(() => {
    if (combinedEmail && checkedEmail && combinedEmail !== checkedEmail) {
      setEmailCheckResult({
        checked: false,
        available: false,
        message: "이메일이 변경되었습니다. 다시 중복확인해주세요.",
      });
    }
  }, [emailLocal, emailDomain, emailDomainDirect, isDomainDirect, checkedEmail]);

  // 도메인 직접 입력 모드 변경
  const handleDomainModeChange = (direct: boolean) => {
    setIsDomainDirect(direct);
    if (direct) {
      setValue("emailDomainDirect", "");
    } else {
      setValue("emailDomain", "naver.com");
    }
    setEmailCheckResult(null);
    setCheckedEmail(null);
  };

  // 이메일 중복확인
  const handleEmailCheck = async () => {
    if (!emailLocal) {
      setEmailCheckResult({
        checked: false,
        available: false,
        message: "이메일을 입력해주세요.",
      });
      return;
    }

    const domain = isDomainDirect ? emailDomainDirect : emailDomain;
    
    if (!domain) {
      setEmailCheckResult({
        checked: false,
        available: false,
        message: "도메인을 입력해주세요.",
      });
      return;
    }

    const emailToCheck = `${emailLocal}@${domain}`;

    // 이메일 형식 검증
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailToCheck)) {
      setEmailCheckResult({
        checked: false,
        available: false,
        message: "올바른 이메일 형식을 입력해주세요.",
      });
      return;
    }

    setIsCheckingEmail(true);
    setEmailCheckResult(null);
    setError(null);

    try {
      const url = getApiEndpoint(`/api/v1/auth/check-email?email=${encodeURIComponent(emailToCheck)}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "manual", // 리다이렉트를 수동으로 처리
      });

      // 302 리다이렉트 체크
      if (response.status === 302 || response.status === 301 || response.status === 307 || response.status === 308) {
        const location = response.headers.get("Location");
        throw new Error(
          `서버에서 리다이렉트가 발생했습니다. (${response.status})\n` +
          `이는 Spring Security 설정에서 /api/v1/auth/** 경로가 허용되지 않아서 발생하는 문제입니다.\n` +
          `백엔드 SecurityConfig에 "/api/v1/auth/**"를 permitAll()에 추가해주세요.\n` +
          `리다이렉트 위치: ${location || "없음"}`
        );
      }

      // 리다이렉트가 아닌 경우에만 JSON 파싱
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 요청 실패 (${response.status}): ${errorText || response.statusText}`);
      }

      const data: EmailCheckResponseWrapper = await response.json();

      if (!response.ok || (!data.isSuccess && !(data as any).success)) {
        throw new Error(data.message || "이메일 중복확인에 실패했습니다.");
      }

      // API 응답에서 available 또는 isAvailable 필드를 확인
      const isAvailable = (data.result as any)?.available ?? data.result?.isAvailable ?? false;
      
      if (isAvailable) {
        setEmailCheckResult({
          checked: true,
          available: true,
          message: "사용 가능한 이메일입니다.",
        });
        setCheckedEmail(emailToCheck);
      } else {
        setEmailCheckResult({
          checked: true,
          available: false,
          message: "이미 사용 중인 이메일입니다.",
        });
        setCheckedEmail(null);
      }
    } catch (err) {
      setEmailCheckResult({
        checked: false,
        available: false,
        message: err instanceof Error ? err.message : "이메일 중복확인에 실패했습니다.",
      });
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const onSubmit = async (data: {
    emailLocal: string;
    emailDomain: string;
    emailDomainDirect: string;
    verificationCode: string;
    password: string;
    confirmPassword: string;
    name: string;
    gender: Gender;
    birthday: string;
  }) => {
    // 이메일 중복확인 체크
    const currentEmail = combinedEmail;
    
    if (!emailCheckResult?.checked || !emailCheckResult?.available || checkedEmail !== currentEmail) {
      setError("이메일 중복확인을 해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 생년월일 형식 변환 (YYYYMMDD -> YYYY-MM-DD)
      const formattedBirthday = data.birthday.replace(
        /(\d{4})(\d{2})(\d{2})/,
        "$1-$2-$3"
      );

      const requestData: SignupRequest = {
        email: combinedEmail,
        password: data.password,
        name: data.name,
        birthday: formattedBirthday,
        gender: data.gender,
      };

      const response = await fetch(getApiEndpoint("/api/v1/auth/signup"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        redirect: "manual", // 리다이렉트를 수동으로 처리
      });

      // 302 리다이렉트 체크 (Spring Security 설정 문제)
      if (response.status === 302 || response.status === 301 || response.status === 307 || response.status === 308) {
        const location = response.headers.get("Location");
        throw new Error(
          `서버에서 리다이렉트가 발생했습니다. (${response.status})\n` +
          `이는 Spring Security 설정에서 /api/v1/auth/** 경로가 허용되지 않아서 발생하는 문제입니다.\n` +
          `백엔드 SecurityConfig에 "/api/v1/auth/**"를 permitAll()에 추가해주세요.\n` +
          `리다이렉트 위치: ${location || "없음"}`
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `회원가입에 실패했습니다. (${response.status}) 다시 시도해주세요.`
        );
      }

      // 성공 시 로그인 페이지로 이동
      router.push("/login");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "회원가입에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Back Button */}
      <header className="bg-white border-b border-gray-border px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
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
          <h1 className="text-lg font-semibold text-navy">회원가입</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Signup Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 아이디(이메일) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-dark">
                아이디(이메일)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  {...register("emailLocal", {
                    required: "이메일을 입력해주세요.",
                    pattern: {
                      value: /^[a-zA-Z0-9._-]+$/,
                      message: "올바른 이메일 형식을 입력해주세요.",
                    },
                  })}
                  placeholder="example"
                  className="input flex-[2] min-w-0"
                />
                <span className="text-gray-dark font-medium shrink-0">@</span>
                {isDomainDirect ? (
                  <input
                    type="text"
                    {...register("emailDomainDirect", {
                      required: "도메인을 입력해주세요.",
                      pattern: {
                        value: /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: "올바른 도메인 형식을 입력해주세요.",
                      },
                    })}
                    placeholder="gmail.com"
                    className="input flex-[2] min-w-0"
                  />
                ) : (
                  <div className="relative flex-[2] min-w-0">
                    <select
                      {...register("emailDomain", {
                        required: "도메인을 선택해주세요.",
                      })}
                      className="input w-full appearance-none cursor-pointer"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "direct") {
                          handleDomainModeChange(true);
                        } else {
                          setValue("emailDomain", value);
                        }
                      }}
                    >
                      <option value="naver.com">naver.com</option>
                      <option value="gmail.com">gmail.com</option>
                      <option value="daum.net">daum.net</option>
                      <option value="kakao.com">kakao.com</option>
                      <option value="direct">직접 입력</option>
                    </select>
                  </div>
                )}
              </div>
              {errors.emailLocal && (
                <p className="text-sm text-red-500">
                  {errors.emailLocal.message}
                </p>
              )}
              {errors.emailDomain && !isDomainDirect && (
                <p className="text-sm text-red-500">
                  {errors.emailDomain.message}
                </p>
              )}
              {errors.emailDomainDirect && isDomainDirect && (
                <p className="text-sm text-red-500">
                  {errors.emailDomainDirect.message}
                </p>
              )}
              {emailCheckResult && (
                <div
                  className={`flex items-center gap-2 text-sm font-medium ${
                    emailCheckResult.checked && emailCheckResult.available
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {emailCheckResult.checked && emailCheckResult.available ? (
                    <>
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{emailCheckResult.message}</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{emailCheckResult.message}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 이메일 중복확인 */}
            <div className="space-y-2">
              {isEmailChanged && (
                <p className="text-sm text-orange-600 font-medium">
                  ⚠️ 이메일이 변경되었습니다. 다시 중복확인해주세요.
                </p>
              )}
              <button
                type="button"
                onClick={handleEmailCheck}
                disabled={isCheckingEmail || !emailLocal || (isDomainDirect ? !emailDomainDirect : !emailDomain)}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingEmail ? "확인 중..." : isEmailChanged ? "다시 중복확인" : "중복확인"}
              </button>
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
                    minLength: {
                      value: 8,
                      message: "비밀번호는 8자 이상 입력해주세요.",
                    },
                    maxLength: {
                      value: 16,
                      message: "비밀번호는 16자 이하로 입력해주세요.",
                    },
                    pattern: {
                      value: /^(?=.*[a-zA-Z])(?=.*[0-9]).+$/,
                      message: "영문과 숫자를 조합하여 입력해주세요.",
                    },
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
              <p className="text-xs text-gray-text">
                8-16자의 영문/숫자를 조합하여 입력하세요.
              </p>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* 비밀번호 재확인 */}
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-dark"
              >
                비밀번호 재확인
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword", {
                    required: "비밀번호를 다시 입력해주세요.",
                    validate: (value) =>
                      value === password || "비밀번호가 일치하지 않습니다.",
                  })}
                  placeholder="비밀번호를 다시 입력해주세요."
                  className="input-icon w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text hover:text-gray-dark"
                  aria-label={
                    showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                  }
                >
                  {showConfirmPassword ? (
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
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* 이름 */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-dark"
              >
                이름
              </label>
              <input
                id="name"
                type="text"
                {...register("name", {
                  required: "이름을 입력해주세요.",
                  minLength: {
                    value: 2,
                    message: "이름은 2자 이상 입력해주세요.",
                  },
                  maxLength: {
                    value: 20,
                    message: "이름은 20자 이하로 입력해주세요.",
                  },
                })}
                placeholder="이름을 입력해 주세요."
                className="input w-full"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* 성별 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-dark mb-3">
                성별
              </label>
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    value={Gender.MALE}
                    {...register("gender", {
                      required: "성별을 선택해주세요.",
                    })}
                    className="sr-only"
                  />
                  <div
                    className={`btn-outline text-center py-3 transition-all ${
                      gender === Gender.MALE
                        ? "bg-navy text-white border-navy"
                        : ""
                    }`}
                  >
                    남성
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    value={Gender.FEMALE}
                    {...register("gender", {
                      required: "성별을 선택해주세요.",
                    })}
                    className="sr-only"
                  />
                  <div
                    className={`btn-outline text-center py-3 transition-all ${
                      gender === Gender.FEMALE
                        ? "bg-navy text-white border-navy"
                        : ""
                    }`}
                  >
                    여성
                  </div>
                </label>
              </div>
              {errors.gender && (
                <p className="text-sm text-red-500">{errors.gender.message}</p>
              )}
            </div>

            {/* 생년월일 */}
            <div className="space-y-2">
              <label
                htmlFor="birthday"
                className="block text-sm font-medium text-gray-dark"
              >
                생년월일
              </label>
              <input
                id="birthday"
                type="text"
                {...register("birthday", {
                  required: "생년월일을 입력해주세요.",
                  pattern: {
                    value: /^\d{8}$/,
                    message: "8자리 숫자로 입력해주세요. (예: 20010101)",
                  },
                  validate: (value) => {
                    if (!value || value.length !== 8) {
                      return "8자리 숫자로 입력해주세요.";
                    }
                    
                    const year = parseInt(value.substring(0, 4));
                    const month = parseInt(value.substring(4, 6));
                    const day = parseInt(value.substring(6, 8));
                    
                    if (month < 1 || month > 12) {
                      return "올바른 월을 입력해주세요.";
                    }
                    
                    if (day < 1 || day > 31) {
                      return "올바른 일을 입력해주세요.";
                    }
                    
                    const date = new Date(year, month - 1, day);
                    
                    if (
                      date.getFullYear() !== year ||
                      date.getMonth() !== month - 1 ||
                      date.getDate() !== day
                    ) {
                      return "올바른 날짜를 입력해주세요.";
                    }
                    
                    const today = new Date();
                    const age = today.getFullYear() - year;
                    if (age < 0 || age > 150) {
                      return "올바른 생년월일을 입력해주세요.";
                    }
                    
                    return true;
                  },
                })}
                placeholder="8자리 ex)20010101"
                maxLength={8}
                inputMode="numeric"
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.value = target.value.replace(/[^0-9]/g, "");
                }}
                className="input w-full"
              />
              {errors.birthday && (
                <p className="text-sm text-red-500">{errors.birthday.message}</p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="pt-2 pb-4">
              <div className="bg-gray-bg p-4 rounded-lg">
                <p className="text-xs text-gray-text leading-relaxed">
                  회원가입 시{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-navy hover:underline font-medium"
                  >
                    서비스 이용약관
                  </Link>
                  {" "}및{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-navy hover:underline font-medium"
                  >
                    개인정보처리방침
                  </Link>
                  에 동의한 것으로 간주됩니다.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "가입 중..." : "회원가입"}
              </button>
            </div>
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
            <p className="mt-4 text-center text-xs text-gray-text">
              카카오 로그인으로도 가입할 수 있습니다
            </p>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-text">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-navy hover:underline">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
