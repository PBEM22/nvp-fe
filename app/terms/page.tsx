import Link from "next/link";
import Image from "next/image";

/**
 * 서비스 약관 페이지
 */
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Link
            href="/signup"
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
          </Link>
          <h1 className="text-lg font-semibold text-navy">서비스 이용약관</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-lg max-w-none">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.png"
                alt="NVP Logo"
                width={48}
                height={48}
                className="rounded-lg"
              />
              <div>
                <h2 className="text-2xl font-bold text-navy mb-1">
                  남서울대학교 배구부 서비스 이용약관
                </h2>
                <p className="text-sm text-gray-text">
                  시행일자: 2025년 1월 1일
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 text-gray-dark leading-relaxed">
            {/* 제1조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제1조 (목적)</h3>
              <p className="mb-2">
                본 약관은 남서울대학교 배구부(이하 "NVP")가 운영하는 NVP 서비스(이하 "서비스")의 이용과 관련하여 NVP와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            {/* 제2조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제2조 (정의)</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>"서비스"란 배구부가 제공하는 회원 관리, 경기 기록, 출석 관리, 커뮤니티 등 모든 온라인 서비스를 의미합니다.</li>
                <li>"이용자"란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 의미합니다.</li>
                <li>"회원"이란 서비스에 회원등록을 하고 서비스를 이용하는 자를 의미합니다.</li>
                <li>"아이디(ID)"란 회원의 식별과 서비스 이용을 위하여 회원이 정하고 배구부가 승인하는 문자와 숫자의 조합을 의미합니다.</li>
                <li>"비밀번호"란 회원이 부여받은 아이디와 일치된 회원임을 확인하고 회원의 권익 보호를 위하여 회원이 정한 문자와 숫자의 조합을 의미합니다.</li>
              </ol>
            </section>

            {/* 제3조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제3조 (약관의 게시와 개정)</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>배구부는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</li>
                <li>배구부는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</li>
                <li>배구부가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기 화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</li>
                <li>이용자는 개정된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 회원 탈퇴를 요청할 수 있습니다.</li>
              </ol>
            </section>

            {/* 제4조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제4조 (회원가입)</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>회원가입은 신청자가 온라인으로 배구부에서 제공하는 소정의 가입신청 양식에서 요구하는 사항을 기록하여 가입을 완료하는 것으로 성립됩니다.</li>
                <li>배구부는 다음 각 호에 해당하는 경우 회원가입을 거부할 수 있습니다.
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                    <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                    <li>이미 가입된 회원과 이메일이 중복되는 경우</li>
                    <li>배구부가 정한 회원가입 요건이 만족되지 않은 경우</li>
                    <li>기타 회원으로 등록하는 것이 배구부의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                  </ul>
                </li>
                <li>회원가입의 성립시기는 배구부의 승낙이 회원에게 도달한 시점으로 합니다.</li>
              </ol>
            </section>

            {/* 제5조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제5조 (서비스의 제공 및 변경)</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>배구부는 다음과 같은 서비스를 제공합니다.
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>회원 정보 관리 서비스</li>
                    <li>경기 기록 및 통계 조회 서비스</li>
                    <li>출석 관리 서비스</li>
                    <li>커뮤니티 및 게시판 서비스</li>
                    <li>기타 배구부가 추가 개발하거나 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</li>
                  </ul>
                </li>
                <li>배구부는 서비스의 내용을 변경할 수 있으며, 변경 시에는 사전에 공지합니다.</li>
              </ol>
            </section>

            {/* 제6조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제6조 (서비스의 중단)</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>배구부는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
                <li>배구부는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 배구부가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.</li>
              </ol>
            </section>

            {/* 제7조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제7조 (회원의 의무)</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>회원은 다음 행위를 하여서는 안 됩니다.
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>신청 또는 변경 시 허위 내용의 등록</li>
                    <li>타인의 정보 도용</li>
                    <li>배구부가 게시한 정보의 변경</li>
                    <li>배구부가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                    <li>배구부와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                    <li>배구부 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                    <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                  </ul>
                </li>
                <li>회원은 관계법령, 본 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항, 배구부가 통지하는 사항 등을 준수하여야 하며, 기타 배구부의 업무에 방해되는 행위를 하여서는 안 됩니다.</li>
              </ol>
            </section>

            {/* 제8조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제8조 (개인정보의 보호)</h3>
              <p className="mb-2">
                배구부는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력합니다. 회원의 개인정보 보호에 관해서는 관련법령 및 배구부가 정하는 "개인정보처리방침"에 정한 바에 따릅니다.
              </p>
            </section>

            {/* 제9조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제9조 (회원 탈퇴 및 자격 상실)</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>회원은 배구부에 언제든지 탈퇴를 요청할 수 있으며, 배구부는 즉시 회원 탈퇴를 처리합니다.</li>
                <li>회원이 다음 각 호의 사유에 해당하는 경우, 배구부는 회원자격을 제한 및 정지시킬 수 있습니다.
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>가입 신청 시에 허위 내용을 등록한 경우</li>
                    <li>다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
                    <li>서비스를 이용하여 법령 또는 본 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
                  </ul>
                </li>
              </ol>
            </section>

            {/* 제10조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제10조 (면책조항)</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>배구부는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
                <li>배구부는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
                <li>배구부는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</li>
              </ol>
            </section>

            {/* 제11조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제11조 (준거법 및 관할법원)</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>배구부와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다.</li>
                <li>배구부와 이용자 간에 제기된 전자상거래 소송에는 한국법을 적용합니다.</li>
              </ol>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-border text-center text-sm text-gray-text">
            <p>본 약관은 2025년 1월 1일부터 시행됩니다.</p>
            <p className="mt-2">
              문의사항이 있으시면{" "}
              <Link href="/" className="text-navy hover:underline">
                홈페이지
              </Link>
              를 통해 연락주시기 바랍니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

