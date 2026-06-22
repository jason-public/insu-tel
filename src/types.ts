export interface Member {
  id: string;
  serialNo: number; // 순번 (내부 번호)
  category: string; // 구분 (예: 기획자치분과, 미래경제분과 등)
  role: string;     // 직위 (예: 위원장, 부위원장, 간사, 자문위원 등)
  name: string;     // 성명
  phone: string;    // 전화번호
  career: string;   // 대표경력 (줄바꿈 포함 가능)
  note: string;     // 비고 (사의, 미래경제분과 등)
}

export interface SecurityConfig {
  accessPasswordHash: string; // 일반 접속 비밀번호 해시
  adminPasswordHash: string;  // 관리자 비밀번호 해시
  isAccessPasswordSet: boolean;
  isAdminPasswordSet: boolean;
}

export const DEFAULT_ACCESS_PASSWORD_PLAIN = "2026";
export const DEFAULT_ADMIN_PASSWORD_PLAIN = "admin2026";

// SHA-256 hex string hashes for defaults (calculated in-line as secondary falls)
export const DEFAULT_ACCESS_SHA256 = "534ed4750f83658ebc0c7a36ac04bd5cb0316d338c9c647b5380536a0fb401e4"; // "2026"
export const DEFAULT_ADMIN_SHA256 = "6da916ebcf5e06401660d5ddb6ac91fac002e20b3bfefc67cf7569b935bdffbc";  // "admin2026"

export const CATEGORIES_LIST = [
  "전체",
  "인수위원회",
  "기획자치분과",
  "미래경제분과",
  "도시교통환경분과",
  "복지문화교육분과",
  "자문위원총괄간사",
  "공동주택특위간사",
  "재정혁신특위",
  "대변인",
  "도시교통_(공주특위)",
  "사의/기타"
];
