/**
 * NVP API Type Definitions
 * 
 * 이 파일은 NVP 프로젝트의 모든 API 요청/응답 타입을 정의합니다.
 * swagger.json을 기반으로 생성되었습니다.
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * 사용자 역할 (User Role)
 */
export enum UserRole {
  /** 일반 사용자 */
  USER = 'ROLE_USER',
  /** 정식 회원 */
  MEMBER = 'ROLE_MEMBER',
  /** 운영진 */
  MANAGER = 'ROLE_MANAGER',
  /** 관리자 */
  ADMIN = 'ROLE_ADMIN',
}

/**
 * 회원 상태 (Membership Status)
 */
export enum MembershipStatus {
  /** 활동 회원 */
  ACTIVE_MEMBER = 'ACTIVE_MEMBER',
  /** 졸업생/동문 */
  ALUMNI = 'ALUMNI',
  /** 휴학/휴회 */
  ON_LEAVE = 'ON_LEAVE',
  /** 탈퇴 */
  WITHDRAWN = 'WITHDRAWN',
}

/**
 * 출석 상태 (Attendance Status)
 */
export enum AttendanceStatus {
  /** 출석 */
  PRESENT = 'PRESENT',
  /** 결석 */
  ABSENT = 'ABSENT',
  /** 지각 */
  LATE = 'LATE',
  /** 조퇴 */
  EARLY_LEAVE = 'EARLY_LEAVE',
}

/**
 * 게시판 타입 (Board Type)
 */
export enum BoardType {
  /** 공지사항 */
  NOTICE = 'NOTICE',
  /** 자유게시판 */
  FREE = 'FREE',
  /** 사진게시판 */
  PHOTO = 'PHOTO',
  /** 문의게시판 */
  INQUIRY = 'INQUIRY',
}

/**
 * 성별 (Gender)
 */
export enum Gender {
  /** 남성 */
  MALE = '남성',
  /** 여성 */
  FEMALE = '여성',
}

/**
 * 출석 회차 (Attendance Round)
 */
export enum AttendanceRound {
  /** 1회차 */
  ROUND_1 = 1,
  /** 2회차 */
  ROUND_2 = 2,
}

// ============================================================================
// Common Types
// ============================================================================

/**
 * API 공통 응답 래퍼
 */
export interface ApiResponse<T> {
  /** 성공 여부 */
  isSuccess: boolean;
  /** 응답 코드 */
  code: string;
  /** 응답 메시지 */
  message: string;
  /** 응답 데이터 */
  result?: T;
}

/**
 * 단위 응답 (성공/실패만 반환)
 */
export interface ApiResponseUnit {
  isSuccess: boolean;
  code: string;
  message: string;
}

/**
 * 생성 응답 (생성된 ID 반환)
 */
export interface CreatedResponse {
  /** 생성된 리소스 ID */
  id: number;
}

/**
 * 페이징 요청 파라미터
 */
export interface Pageable {
  /** 페이지 번호 (0부터 시작) */
  page: number;
  /** 페이지 크기 */
  size: number;
  /** 정렬 기준 (예: ["id,desc", "name,asc"]) */
  sort?: string[];
}

/**
 * 페이징 응답
 */
export interface PageResponse<T> {
  /** 전체 요소 수 */
  totalElements: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 첫 페이지 여부 */
  first: boolean;
  /** 마지막 페이지 여부 */
  last: boolean;
  /** 페이지 크기 */
  size: number;
  /** 현재 페이지 내용 */
  content: T[];
  /** 현재 페이지 번호 */
  number: number;
  /** 현재 페이지 요소 수 */
  numberOfElements: number;
  /** 빈 페이지 여부 */
  empty: boolean;
  /** 페이징 정보 */
  pageable?: PageableObject;
  /** 정렬 정보 */
  sort?: SortObject;
}

/**
 * 페이징 객체
 */
export interface PageableObject {
  /** 오프셋 */
  offset: number;
  /** 페이지 번호 */
  pageNumber: number;
  /** 페이지 크기 */
  pageSize: number;
  /** 페이징 여부 */
  paged: boolean;
  /** 비페이징 여부 */
  unpaged: boolean;
  /** 정렬 정보 */
  sort?: SortObject;
}

/**
 * 정렬 객체
 */
export interface SortObject {
  /** 정렬 여부 */
  sorted: boolean;
  /** 비정렬 여부 */
  unsorted: boolean;
  /** 빈 정렬 여부 */
  empty: boolean;
}

// ============================================================================
// Auth API Types
// ============================================================================

/**
 * 회원가입 요청
 */
export interface SignupRequest {
  /** 이메일 주소 */
  email: string;
  /** 비밀번호 (8~16자 영문, 숫자 조합) */
  password: string;
  /** 사용자 이름 */
  name: string;
  /** 생년월일 (YYYY-MM-DD) */
  birthday: string;
  /** 성별 ('남성' 또는 '여성') */
  gender: Gender;
}

/**
 * 로그인 요청
 */
export interface LoginRequest {
  /** 이메일 주소 */
  email: string;
  /** 비밀번호 */
  password: string;
}

/**
 * 로그인 응답
 */
export interface LoginResponse {
  /** 발급된 Access Token */
  accessToken: string;
  /** 정식 회원인 경우의 memberId. 정식 회원이 아니면 null */
  memberId?: number | null;
}

/**
 * 토큰 재발급 응답
 */
export interface AccessTokenResponse {
  /** 새로 발급된 Access Token */
  accessToken: string;
}

// ============================================================================
// Member API Types
// ============================================================================

/**
 * 회원 상세 정보 응답
 */
export interface MemberDetailResponse {
  /** 회원 고유 ID */
  memberId: number;
  /** 사용자 고유 ID */
  userId: number;
  /** 이메일 */
  email: string;
  /** 이름 */
  name: string;
  /** 생년월일 (YYYY-MM-DD) */
  birthday?: string;
  /** 성별 (true: 남성, false: 여성) */
  isMale?: boolean;
  /** 프로필 이미지 URL */
  profileImageUrl?: string;
  /** 등번호 */
  backNumber?: number;
  /** 학과 */
  major?: string;
  /** 연혁 공개 여부 */
  isPublic: boolean;
  /** 회원 상태 */
  membershipStatus: MembershipStatus;
  /** 역대 활동 이력 목록 */
  assignments: AssignmentHistoryDto[];
}

/**
 * 회원 요약 정보 (목록 조회용)
 */
export interface MemberSummaryResponse {
  /** 회원 고유 ID */
  memberId: number;
  /** 사용자 고유 ID */
  userId: number;
  /** 이메일 */
  email: string;
  /** 이름 */
  name: string;
  /** 회원 상태 */
  membershipStatus: MembershipStatus;
}

/**
 * 회원 역대 활동 이력
 */
export interface AssignmentHistoryDto {
  /** 부서명 */
  departmentName: string;
  /** 직책명 */
  positionName: string;
  /** 표시 이름 */
  displayName: string;
  /** 연도 */
  periodYear: number;
  /** 학기 */
  periodSemester: number;
  /** 기수 */
  periodNumber: number;
}

/**
 * 회원 통산 기록 응답
 */
export interface ScoreRecordResponse {
  /** 선수 고유 ID */
  memberId: number;
  /** 출전한 총 대회 수 */
  tournamentsPlayed: number;
  /** 출전한 총 경기 수 */
  matchesPlayed: number;
  /** 출전한 총 세트 수 */
  setsPlayed: number;
  /** 누적 총 득점 */
  totalScore: number;
  /** 누적 총 공격 시도 */
  totalAttackAttempt: number;
  /** 누적 총 공격 성공 */
  totalAttackSuccess: number;
  /** 누적 총 공격 범실 */
  totalAttackError: number;
  /** 누적 총 공격 차단 당함 */
  totalAttackBlock: number;
  /** 통산 공격 성공률 (%) */
  attackSuccessRate: number;
  /** 통산 공격 효율 (%) */
  attackEfficiency: number;
  /** 누적 총 리시브 시도 */
  totalReceiveAttempt: number;
  /** 누적 총 리시브 성공(Perfect) */
  totalReceivePerfect: number;
  /** 누적 총 리시브 범실 */
  totalReceiveError: number;
  /** 통산 리시브 성공률 (%) */
  receiveSuccessRate: number;
  /** 통산 리시브 효율 (%) */
  receiveEfficiency: number;
  /** 누적 총 블로킹 시도 */
  totalBlockAttempt: number;
  /** 누적 총 블로킹 성공(득점) */
  totalBlockSuccess: number;
  /** 누적 총 유효 블로킹 */
  totalBlockEffective: number;
  /** 누적 총 블로킹 범실(네트터치 등) */
  totalBlockError: number;
  /** 누적 총 블로킹 실패 */
  totalBlockFault: number;
  /** 통산 블로킹 성공률 (%) */
  blockSuccessRate: number;
  /** 통산 블로킹 효율 (%) */
  blockEfficiency: number;
  /** 누적 총 서브 시도 */
  totalServeAttempt: number;
  /** 누적 총 서브 에이스(득점) */
  totalServeAce: number;
  /** 누적 총 서브 범실 */
  totalServeError: number;
  /** 통산 서브 성공률 (%) */
  serveSuccessRate: number;
  /** 통산 서브 효율 (%) */
  serveEfficiency: number;
  /** 누적 총 디그 시도 */
  totalDigAttempt: number;
  /** 누적 총 디그 성공 */
  totalDigSuccess: number;
  /** 누적 총 디그 범실 */
  totalDigError: number;
  /** 통산 디그 성공률 (%) */
  digSuccessRate: number;
  /** 통산 디그 효율 (%) */
  digEfficiency: number;
  /** 누적 총 세트(토스) 시도 */
  totalTossAttempt: number;
  /** 누적 총 세트 성공 */
  totalTossSuccess: number;
  /** 누적 총 세트 범실 */
  totalTossError: number;
  /** 통산 세트 성공률 (%) */
  tossSuccessRate: number;
  /** 통산 세트 효율 (%) */
  tossEfficiency: number;
}

/**
 * 회원 참여 경기 목록 응답
 */
export interface MemberMatchResponse {
  /** 경기 ID */
  matchId: number;
  /** 경기 날짜 (YYYY-MM-DD) */
  matchDate: string;
  /** 대회 이름 */
  tournamentName: string;
  /** 상대팀 이름 (학교 포함) */
  opponentDisplayName: string;
  /** 승리 여부 */
  isWin: boolean;
  /** 우리 팀 세트 스코어 */
  teamScore: number;
  /** 상대 팀 세트 스코어 */
  opponentScore: number;
}

/**
 * 기수별 출석 상세 내역 응답
 */
export interface GroupedMyAttendanceResponse {
  /** 현재 동아리 활동 기수. 활성화된 기수가 없으면 null */
  currentPeriodNumber?: number | null;
  /** 기수별로 그룹화된 출석 내역 목록 */
  attendanceByPeriods: PeriodAttendance[];
}

/**
 * 기수별 출석 상세 내역
 */
export interface PeriodAttendance {
  /** 기수 정보 */
  period: PeriodInfo;
  /** 해당 기수의 출석 요약 정보 */
  summary: PeriodAttendanceSummary;
  /** 해당 기수의 날짜별 출석 상세 내역 */
  details: MyAttendanceDetailResponse[];
}

/**
 * 기수 정보
 */
export interface PeriodInfo {
  /** 연도 */
  year: number;
  /** 학기 */
  semester: number;
  /** 기수 번호 */
  number: number;
}

/**
 * 기수별 출석률 요약 정보
 */
export interface PeriodAttendanceSummary {
  /** 해당 기수의 총 운동일수 */
  totalExerciseDays: number;
  /** 해당 기수의 총 출석일수 */
  totalPresentDays: number;
  /** 해당 기수의 총 지각일수 */
  totalLateDays: number;
  /** 해당 기수의 총 조퇴일수 */
  totalEarlyLeaveDays: number;
  /** 해당 기수의 총 결석일수 */
  totalAbsentDays: number;
  /** 해당 기수의 전체 출석률 (소수점 2자리) */
  attendanceRate: number;
}

/**
 * 회원 본인의 날짜별 출석 상세 정보
 */
export interface MyAttendanceDetailResponse {
  /** 운동 날짜 (YYYY-MM-DD) */
  date: string;
  /** 1회차 출석 상태 */
  round1Status: AttendanceStatus | string;
  /** 2회차 출석 상태 */
  round2Status: AttendanceStatus | string;
  /** 최종 출석 상태 */
  finalStatus: string;
  /** 해당 출석 기록의 연도 */
  periodYear?: number;
  /** 해당 출석 기록의 학기 */
  periodSemester?: number;
  /** 해당 출석 기록의 기수 번호 */
  periodNumber?: number;
}

/**
 * 회원 목록 조회 필터 (쿼리 파라미터)
 */
export interface MemberListQuery {
  /** 페이지 번호 (0부터 시작) */
  page: number;
  /** 페이지 크기 */
  size: number;
  /** 정렬 기준 (예: "user.name,asc" 또는 "id,desc") */
  sort?: string[];
  /** 활동 연도 */
  year?: number;
  /** 기수 */
  periodNumber?: number;
  /** 부서 ID */
  departmentId?: number;
  /** 직책 ID */
  positionId?: number;
  /** 검색어 (이름 또는 학과) */
  keyword?: string;
}

// ============================================================================
// Tournament API Types
// ============================================================================

/**
 * 대회 정보 응답
 */
export interface TournamentResponse {
  /** 대회 ID */
  id: number;
  /** 대회 이름 */
  tournamentName: string;
  /** 6인제 여부 */
  isSixPlayer: boolean;
}

/**
 * 대회 생성 요청
 */
export interface TournamentCreateRequest {
  /** 대회 이름 */
  tournamentName: string;
  /** 6인제 여부 */
  isSixPlayer: boolean;
}

// ============================================================================
// Opponent School API Types
// ============================================================================

/**
 * 상대 학교 정보 응답
 */
export interface OpponentSchoolResponse {
  /** 상대 학교 ID */
  id: number;
  /** 학교 이름 */
  schoolName: string;
  /** 팀 이름 */
  teamName: string;
  /** 학교 로고 이미지 URL */
  schoolLogoUrl?: string;
}

/**
 * 상대 학교 생성 요청
 */
export interface OpponentSchoolCreateRequest {
  /** 학교 이름 */
  schoolName: string;
  /** 팀 이름 */
  teamName: string;
  /** 학교 로고 이미지 URL */
  schoolLogoUrl?: string;
}

// ============================================================================
// Match API Types
// ============================================================================

/**
 * 경기 정보 응답
 */
export interface MatchResponse {
  /** 경기 ID */
  id: number;
  /** 대회 이름 */
  tournamentName: string;
  /** 상대팀 표시 이름 */
  opponentDisplayName: string;
  /** 남자부 여부 */
  isMale: boolean;
  /** 승리 여부 */
  isWin: boolean;
  /** 우리 팀 세트 스코어 */
  teamScore: number;
  /** 상대 팀 세트 스코어 */
  opponentScore: number;
  /** MVP 정보 */
  matchMvp?: AwardInfo;
  /** 공격왕 정보 */
  bestSpiker?: AwardInfo;
  /** 수비왕 정보 */
  bestDefender?: AwardInfo;
  /** 경기 장소 */
  matchLocation?: string;
  /** 경기 날짜 (YYYY-MM-DD) */
  matchDate?: string;
}

/**
 * 수상자 정보
 */
export interface AwardInfo {
  /** 수상자 memberId */
  memberId: number;
  /** 수상자 이름 */
  playerName: string;
  /** 수상자 등번호 */
  backNumber?: number;
  /** 선정 이유 */
  reason: string;
}

/**
 * 경기 상세 정보 응답
 */
export interface MatchDetailResponse {
  /** 경기 ID */
  matchId: number;
  /** 경기 날짜 (YYYY-MM-DD) */
  matchDate: string;
  /** 대회 이름 */
  tournamentName: string;
  /** 상대팀 이름 (학교 포함) */
  opponentDisplayName: string;
  /** 승리 여부 */
  isWin: boolean;
  /** 우리 팀 세트 스코어 */
  teamScore: number;
  /** 상대 팀 세트 스코어 */
  opponentScore: number;
  /** 해당 경기 수상자 정보 */
  awards: MatchAwardsResponse;
  /** 해당 경기에 참여한 선수들의 경기 기록 목록 */
  playerMatchStats: MatchPlayerSummaryResponse[];
}

/**
 * 경기별 수상자 정보
 */
export interface MatchAwardsResponse {
  /** MVP 정보 */
  mvp?: AwardInfo;
  /** 공격왕 정보 */
  bestSpiker?: AwardInfo;
  /** 수비왕 정보 */
  bestDefender?: AwardInfo;
}

/**
 * 단일 경기에 대한 한 선수의 요약 기록
 */
export interface MatchPlayerSummaryResponse {
  /** 선수 고유 ID */
  memberId: number;
  /** 선수 이름 */
  playerName: string;
  /** 등번호 */
  backNumber: number;
  /** 해당 경기에서 출전한 총 세트 수 */
  setsPlayed: number;
  /** 해당 경기 총 득점 */
  totalScore: number;
  /** 공격 성공 수 */
  attackSuccess: number;
  /** 디그 성공 수 */
  digSuccess: number;
  /** 블로킹 성공 수 */
  blockSuccess: number;
  /** 서브 득점 수 */
  serveSuccess: number;
  /** 공격 성공률 (%) */
  attackSuccessRate: number;
  /** 공격 효율 (%) */
  attackEfficiency: number;
  /** 리시브 성공률 (%) */
  receiveSuccessRate: number;
  /** 리시브 효율 (%) */
  receiveEfficiency: number;
  /** 블로킹 세트당 평균 */
  blockAvgPerSet: number;
  /** 서브 성공률 (%) */
  serveSuccessRate: number;
}

/**
 * 경기 생성 요청
 */
export interface MatchCreateRequest {
  /** 대회 ID */
  tournamentId: number;
  /** 상대 학교 ID */
  opponentSchoolId: number;
  /** 남자부 여부 */
  isMale: boolean;
  /** 경기 장소 */
  matchLocation: string;
  /** 경기 날짜 (YYYY-MM-DD) */
  matchDate: string;
}

/**
 * 경기 결과 업데이트 요청
 */
export interface MatchResultUpdateRequest {
  /** 경기 승리 여부 */
  isWin: boolean;
  /** 우리 팀의 최종 세트 스코어 */
  teamScore: number;
  /** 상대 팀의 최종 세트 스코어 */
  opponentScore: number;
  /** MVP로 선정된 선수의 memberId */
  mvpMemberId?: number;
  /** 공격왕으로 선정된 선수의 memberId */
  spikerMemberId?: number;
  /** 수비왕으로 선정된 선수의 memberId */
  defenderMemberId?: number;
}

/**
 * 경기 기록 업로드 요청 (쿼리 파라미터)
 */
export interface MatchRecordUploadQuery {
  /** 경기 승리 여부 */
  isWin: boolean;
  /** 우리 팀의 최종 세트 스코어 */
  teamScore: number;
  /** 상대 팀의 최종 세트 스코어 */
  opponentScore: number;
  /** MVP 선수 memberId */
  mvpMemberId?: number;
  /** 공격왕 선수 memberId */
  spikerMemberId?: number;
  /** 수비왕 선수 memberId */
  defenderMemberId?: number;
}

// ============================================================================
// Attendance API Types
// ============================================================================

/**
 * 출석 체크인 요청
 */
export interface CheckInRequest {
  /** 사용자가 입력한 6자리 출석 코드 */
  code: string;
}

/**
 * 출석 코드 생성 요청
 */
export interface GenerateCodeRequest {
  /** 출석 회차 (1 또는 2) */
  round: AttendanceRound;
}

/**
 * 생성된 출석 코드 응답
 */
export interface GenerateCodeResponse {
  /** 생성된 6자리 출석 코드 */
  code: string;
  /** 코드 만료 시간(초) */
  expiresIn: number;
}

/**
 * 출석 상태 수동 변경 요청
 */
export interface UpdateAttendanceRequest {
  /** 대상 회원의 memberId */
  memberId: number;
  /** 대상 날짜 (YYYY-MM-DD) */
  date: string;
  /** 변경할 회차 (1 또는 2) */
  round: AttendanceRound;
  /** 변경할 상태 (PRESENT 또는 ABSENT) */
  status: AttendanceStatus;
}

/**
 * 특정 날짜의 회원별 출석 현황
 */
export interface DailyAttendanceStatusResponse {
  /** 회원 ID */
  memberId: number;
  /** 회원 이름 */
  memberName: string;
  /** 1회차 출석 상태 */
  round1Status: AttendanceStatus | string;
  /** 2회차 출석 상태 */
  round2Status: AttendanceStatus | string;
  /** 최종 출석 상태 */
  finalStatus: string;
}

/**
 * 특정 회원의 출석 기록
 */
export interface MemberAttendanceHistoryResponse {
  /** 운동 날짜 (YYYY-MM-DD) */
  date: string;
  /** 1라운드 출석 상태 */
  round1Status: AttendanceStatus | string;
  /** 2라운드 출석 상태 */
  round2Status: AttendanceStatus | string;
  /** 최종 출석 상태 (출석, 지각, 조퇴, 결석) */
  finalStatus: string;
}

// ============================================================================
// Admin API Types
// ============================================================================

/**
 * 사용자 역할 변경 요청
 */
export interface UpdateUserRolesRequest {
  /** 새롭게 부여할 역할 목록 */
  roles: UserRole[] | string[];
}

/**
 * 회원 상태 변경 요청
 */
export interface UpdateMemberStatusRequest {
  /** 변경할 회원 상태 */
  membershipStatus: MembershipStatus | string;
}

/**
 * 회원 직책 할당 요청
 */
export interface AssignPositionRequest {
  /** 할당할 부서의 ID */
  departmentId: number;
  /** 할당할 직책의 ID */
  positionId: number;
  /** 할당할 기간(기수)의 ID */
  periodId: number;
}

/**
 * 부서 정보 응답
 */
export interface DepartmentResponse {
  /** 부서 ID */
  id: number;
  /** 부서명 */
  name: string;
}

/**
 * 부서 생성 요청
 */
export interface CreateDepartmentRequest {
  /** 새로 생성할 부서명 */
  name: string;
}

/**
 * 부서 수정 요청
 */
export interface UpdateDepartmentRequest {
  /** 수정할 부서명 */
  name: string;
}

/**
 * 직책 정보 응답
 */
export interface PositionResponse {
  /** 직책 ID */
  id: number;
  /** 직책명 */
  name: string;
}

/**
 * 직책 생성 요청
 */
export interface CreatePositionRequest {
  /** 새로 생성할 직책명 */
  name: string;
}

/**
 * 직책 수정 요청
 */
export interface UpdatePositionRequest {
  /** 수정할 직책명 */
  name: string;
}

/**
 * 기수(Period) 정보 응답
 */
export interface PeriodResponse {
  /** 기수 ID */
  id: number;
  /** 연도 */
  year: number;
  /** 학기 */
  semester: number;
  /** 기수 번호 */
  periodNumber: number;
  /** 현재 활동 기수 여부 */
  isCurrent: boolean;
}

/**
 * 기수 생성 요청
 */
export interface CreatePeriodRequest {
  /** 연도 */
  year: number;
  /** 학기 (1 또는 2) */
  semester: number;
  /** 기수 번호 (고유값) */
  periodNumber: number;
}

/**
 * 기수 수정 요청
 */
export interface UpdatePeriodRequest {
  /** 연도 */
  year: number;
  /** 학기 (1 또는 2) */
  semester: number;
  /** 기수 번호 (고유값) */
  periodNumber: number;
}

/**
 * 역할 매핑 정보 응답
 */
export interface RoleMappingResponse {
  /** 매핑 ID */
  id: number;
  /** 부서 ID */
  departmentId: number;
  /** 부서명 */
  departmentName: string;
  /** 직책 ID */
  positionId: number;
  /** 직책명 */
  positionName: string;
  /** 표시 이름 */
  displayName: string;
}

/**
 * 역할 매핑 생성 요청
 */
export interface CreateRoleMappingRequest {
  /** 부서 ID */
  departmentId: number;
  /** 직책 ID */
  positionId: number;
  /** 표시 이름 */
  displayName: string;
}

/**
 * 역할 매핑 수정 요청
 */
export interface UpdateRoleMappingRequest {
  /** 새로운 표시 이름 */
  displayName: string;
}

// ============================================================================
// Board API Types
// ============================================================================

/**
 * 게시글 목록 응답을 위한 요약 DTO
 */
export interface BoardSummaryResponse {
  /** 게시글 ID */
  id: number;
  /** 게시판 타입 */
  boardType: BoardType | string;
  /** 게시글 제목 */
  title: string;
  /** 작성자 이름 */
  authorName: string;
  /** 작성일시 */
  createdAt: string;
}

/**
 * 게시글 상세 정보 응답
 */
export interface BoardDetailResponse {
  /** 게시글 ID */
  id: number;
  /** 게시판 타입 */
  boardType: BoardType | string;
  /** 게시글 제목 */
  title: string;
  /** 게시글 내용 */
  content: string;
  /** 작성자 이름 */
  authorName: string;
  /** 작성일시 */
  createdAt: string;
  /** 최종 수정일시 */
  updatedAt: string;
}

/**
 * 게시글 생성 요청
 */
export interface CreateBoardRequest {
  /** 게시판 타입 */
  boardType: BoardType | string;
  /** 게시글 제목 */
  title: string;
  /** 게시글 내용 */
  content: string;
}

/**
 * 게시글 수정 요청
 */
export interface UpdateBoardRequest {
  /** 수정할 게시글 제목 */
  title: string;
  /** 수정할 게시글 내용 */
  content: string;
}

/**
 * 게시글 목록 조회 쿼리 파라미터
 */
export interface BoardListQuery {
  /** 페이지 번호 (0부터 시작) */
  page: number;
  /** 페이지 크기 */
  size: number;
  /** 정렬 기준 */
  sort?: string[];
  /** 게시판 타입 필터 */
  boardType?: BoardType | string;
}

// ============================================================================
// Comment API Types
// ============================================================================

/**
 * 댓글/대댓글 응답
 */
export interface CommentResponse {
  /** 댓글 ID */
  commentId: number;
  /** 작성자 이름 */
  authorName: string;
  /** 댓글 내용 */
  content: string;
  /** 작성일시 */
  createdAt: string;
  /** 삭제 여부 */
  isDeleted: boolean;
  /** 대댓글 목록 */
  children: CommentResponse[];
}

/**
 * 댓글/대댓글 생성 요청
 */
export interface CreateCommentRequest {
  /** 댓글 내용 */
  content: string;
  /** 대댓글인 경우, 부모 댓글의 ID */
  parentId?: number;
}

/**
 * 댓글 수정 요청
 */
export interface UpdateCommentRequest {
  /** 수정할 댓글 내용 */
  content: string;
}

// ============================================================================
// API Response Type Aliases
// ============================================================================

/**
 * 인증 API 응답 타입
 */
export type SignupResponse = ApiResponseUnit;
export type LoginResponseWrapper = ApiResponse<LoginResponse>;
export type LogoutResponse = ApiResponseUnit;
export type ReissueResponse = ApiResponse<AccessTokenResponse>;
export type HelloResponse = ApiResponse<string>;

/**
 * 회원 API 응답 타입
 */
export type MemberDetailResponseWrapper = ApiResponse<MemberDetailResponse>;
export type MemberListResponse = ApiResponse<PageResponse<MemberSummaryResponse>>;
export type ScoreRecordResponseWrapper = ApiResponse<ScoreRecordResponse>;
export type GroupedAttendanceResponseWrapper = ApiResponse<GroupedMyAttendanceResponse>;
export type MemberMatchListResponse = ApiResponse<MemberMatchResponse[]>;
export type MemberTournamentListResponse = ApiResponse<TournamentResponse[]>;

/**
 * 대회 API 응답 타입
 */
export type TournamentListResponse = ApiResponse<TournamentResponse[]>;
export type TournamentResponseWrapper = ApiResponse<TournamentResponse>;
export type TournamentCreateResponse = ApiResponse<CreatedResponse>;

/**
 * 상대 학교 API 응답 타입
 */
export type OpponentSchoolListResponse = ApiResponse<OpponentSchoolResponse[]>;
export type OpponentSchoolResponseWrapper = ApiResponse<OpponentSchoolResponse>;
export type OpponentSchoolCreateResponse = ApiResponse<CreatedResponse>;

/**
 * 경기 API 응답 타입
 */
export type MatchCreateResponse = ApiResponse<CreatedResponse>;
export type MatchResponseWrapper = ApiResponse<MatchResponse>;
export type MatchDetailResponseWrapper = ApiResponse<MatchDetailResponse>;
export type MatchPlayerSummaryListResponse = ApiResponse<MatchPlayerSummaryResponse[]>;

/**
 * 출석 API 응답 타입
 */
export type CheckInResponse = ApiResponseUnit;
export type GenerateCodeResponseWrapper = ApiResponse<GenerateCodeResponse>;
export type InvalidateCodeResponse = ApiResponseUnit;
export type UpdateAttendanceResponse = ApiResponseUnit;
export type DailyAttendanceResponse = ApiResponse<DailyAttendanceStatusResponse[]>;
export type MemberAttendanceHistoryResponseWrapper = ApiResponse<MemberAttendanceHistoryResponse[]>;

/**
 * 게시판 API 응답 타입
 */
export type BoardListResponse = ApiResponse<PageResponse<BoardSummaryResponse>>;
export type BoardDetailResponseWrapper = ApiResponse<BoardDetailResponse>;
export type BoardCreateResponse = ApiResponse<CreatedResponse>;
export type BoardUpdateResponse = ApiResponseUnit;
export type BoardDeleteResponse = ApiResponseUnit;

/**
 * 댓글 API 응답 타입
 */
export type CommentListResponse = ApiResponse<CommentResponse[]>;
export type CommentCreateResponse = ApiResponse<CreatedResponse>;
export type CommentUpdateResponse = ApiResponseUnit;
export type CommentDeleteResponse = ApiResponseUnit;

/**
 * 운영진 관리 API 응답 타입
 */
export type DepartmentListResponse = ApiResponse<DepartmentResponse[]>;
export type DepartmentResponseWrapper = ApiResponse<DepartmentResponse>;
export type DepartmentCreateResponse = ApiResponse<DepartmentResponse>;
export type DepartmentUpdateResponse = ApiResponse<DepartmentResponse>;
export type DepartmentDeleteResponse = ApiResponseUnit;

export type PositionListResponse = ApiResponse<PositionResponse[]>;
export type PositionResponseWrapper = ApiResponse<PositionResponse>;
export type PositionCreateResponse = ApiResponse<PositionResponse>;
export type PositionUpdateResponse = ApiResponse<PositionResponse>;
export type PositionDeleteResponse = ApiResponseUnit;

export type PeriodListResponse = ApiResponse<PeriodResponse[]>;
export type PeriodCreateResponse = ApiResponse<CreatedResponse>;
export type PeriodUpdateResponse = ApiResponseUnit;
export type PeriodDeleteResponse = ApiResponseUnit;
export type SetCurrentPeriodResponse = ApiResponseUnit;

export type RoleMappingListResponse = ApiResponse<RoleMappingResponse[]>;
export type RoleMappingResponseWrapper = ApiResponse<RoleMappingResponse>;
export type RoleMappingCreateResponse = ApiResponse<RoleMappingResponse>;
export type RoleMappingUpdateResponse = ApiResponse<RoleMappingResponse>;
export type RoleMappingDeleteResponse = ApiResponseUnit;

export type UpdateUserRolesResponse = ApiResponseUnit;
export type PromoteToMemberResponse = ApiResponse<CreatedResponse>;
export type AssignPositionResponse = ApiResponse<CreatedResponse>;
export type UpdateMemberStatusResponse = ApiResponseUnit;
export type MemberUploadResponse = ApiResponse<string>;
export type MemberUploadTemplateResponse = Blob;
export type MatchRecordTemplateResponse = Blob;
