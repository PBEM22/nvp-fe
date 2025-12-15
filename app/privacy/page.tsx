import Link from "next/link";
import Image from "next/image";

/**
 * 개인정보처리방침 페이지
 */
export default function PrivacyPage() {
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
          <h1 className="text-lg font-semibold text-navy">개인정보처리방침</h1>
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
                  남서울대학교 배구부 개인정보처리방침
                </h2>
                <p className="text-sm text-gray-text">
                  시행일자: 2025년 1월 1일
                </p>
              </div>
            </div>
            <div className="bg-blue-light border-l-4 border-navy p-4 rounded">
              <p className="text-sm text-gray-dark">
                남서울대학교 배구부(이하 "NVP")는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.
              </p>
            </div>
          </div>

          <div className="space-y-8 text-gray-dark leading-relaxed">
            {/* 제1조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제1조 (개인정보의 처리목적)</h3>
              <p className="mb-2">
                배구부는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  <strong>회원 관리</strong>
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리</li>
                    <li>서비스 부정이용 방지, 각종 고지·통지, 고충처리 목적</li>
                  </ul>
                </li>
                <li>
                  <strong>서비스 제공</strong>
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>경기 기록 및 통계 조회, 출석 관리, 커뮤니티 서비스 제공</li>
                    <li>배구부 활동 관련 정보 제공 및 안내</li>
                  </ul>
                </li>
              </ol>
            </section>

            {/* 제2조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제2조 (개인정보의 처리 및 보유기간)</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>배구부는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</li>
                <li>각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li><strong>회원 가입 및 관리:</strong> 회원 탈퇴 시까지 (단, 관련 법령에 따라 보존할 필요가 있는 경우 해당 기간까지 보존)</li>
                    <li><strong>관련 법령에 따른 보존:</strong>
                      <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
                        <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
                        <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
                        <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
                      </ul>
                    </li>
                  </ul>
                </li>
              </ol>
            </section>

            {/* 제3조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제3조 (처리하는 개인정보의 항목)</h3>
              <p className="mb-2">배구부는 다음의 개인정보 항목을 처리하고 있습니다.</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  <strong>회원 가입 및 관리</strong>
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>필수항목: 이메일, 비밀번호, 이름, 생년월일, 성별</li>
                    <li>선택항목: 등번호, 학과, 프로필 이미지</li>
                  </ul>
                </li>
                <li>
                  <strong>서비스 이용 과정에서 자동 수집되는 정보</strong>
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>IP주소, 쿠키, 접속 로그, 서비스 이용 기록 등</li>
                  </ul>
                </li>
              </ol>
            </section>

            {/* 제4조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제4조 (개인정보의 제3자 제공)</h3>
              <p className="mb-2">
                배구부는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
              </p>
            </section>

            {/* 제5조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제5조 (개인정보처리의 위탁)</h3>
              <p className="mb-2">
                배구부는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
              </p>
              <div className="bg-gray-bg p-4 rounded-lg">
                <p className="text-sm">
                  현재 개인정보 처리업무 위탁 계약을 체결하지 않았으며, 향후 위탁이 필요한 경우 관련 법령에 따라 사전에 공지하고 동의를 받겠습니다.
                </p>
              </div>
            </section>

            {/* 제6조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제6조 (정보주체의 권리·의무 및 행사방법)</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>정보주체는 배구부에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>개인정보 처리정지 요구권</li>
                    <li>개인정보 열람요구권</li>
                    <li>개인정보 정정·삭제요구권</li>
                    <li>개인정보 처리정지 요구권</li>
                  </ul>
                </li>
                <li>제1항에 따른 권리 행사는 배구부에 대해 「개인정보 보호법」 시행령 제41조제1항에 따라 서면, 전자우편 등을 통하여 하실 수 있으며, 배구부는 이에 대해 지체없이 조치하겠습니다.</li>
                <li>정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 배구부는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.</li>
              </ol>
            </section>

            {/* 제7조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제7조 (개인정보의 파기)</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>배구부는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</li>
                <li>개인정보 파기의 절차 및 방법은 다음과 같습니다.
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li><strong>파기절차:</strong> 배구부는 파기 사유가 발생한 개인정보를 선정하고, 배구부의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</li>
                    <li><strong>파기방법:</strong>
                      <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
                        <li>전자적 파일 형태: 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제</li>
                        <li>기록물, 인쇄물, 서면 등: 분쇄하거나 소각하여 파기</li>
                      </ul>
                    </li>
                  </ul>
                </li>
              </ol>
            </section>

            {/* 제8조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제8조 (개인정보 보호책임자)</h3>
              <p className="mb-2">
                배구부는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
              </p>
              <div className="bg-gray-bg p-4 rounded-lg">
                <ul className="space-y-1 text-sm">
                  <li><strong>담당부서:</strong> 남서울대학교 배구부 운영진</li>
                  <li><strong>연락처:</strong> 홈페이지를 통해 문의</li>
                </ul>
              </div>
            </section>

            {/* 제9조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제9조 (개인정보의 안전성 확보조치)</h3>
              <p className="mb-2">배구부는 「개인정보 보호법」 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다.</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li><strong>개인정보 취급 직원의 최소화 및 교육:</strong> 개인정보를 취급하는 직원을 지정하고 담당자에 한정시켜 최소화하여 개인정보를 관리하는 대책을 시행하고 있습니다.</li>
                <li><strong>정기적인 자체 감사 실시:</strong> 개인정보 취급 관련 안정성 확보를 위해 정기적으로 자체 감사를 실시하고 있습니다.</li>
                <li><strong>비밀번호 암호화:</strong> 비밀번호는 암호화하여 저장 및 관리되고 있으며, 개인정보의 확인 및 변경은 비밀번호를 알고 있는 본인에 의해서만 가능합니다.</li>
                <li><strong>해킹 등에 대비한 기술적 대책:</strong> 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 보안프로그램을 설치하고 주기적인 갱신·점검을 하며 외부로부터 접근이 통제된 구역에 시스템을 설치하고 기술적/물리적으로 감시 및 차단하고 있습니다.</li>
              </ol>
            </section>

            {/* 제10조 */}
            <section>
              <h3 className="text-xl font-bold text-navy mb-4">제10조 (개인정보처리방침 변경)</h3>
              <p className="mb-2">
                이 개인정보처리방침은 2025년 1월 1일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-border text-center text-sm text-gray-text">
            <p>본 개인정보처리방침은 2025년 1월 1일부터 시행됩니다.</p>
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

