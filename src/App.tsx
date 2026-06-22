import React, { useState, useEffect } from "react";
import { 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  Users, 
  PhoneCall, 
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Briefcase,
  X,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { 
  Member, 
  SecurityConfig, 
  CATEGORIES_LIST,
  DEFAULT_ACCESS_SHA256,
  DEFAULT_ADMIN_SHA256
} from "./types";
import { INITIAL_MEMBERS } from "./data";
import { hashPasscode } from "./utils/crypto";

// Sub-components
import AccessGate from "./components/AccessGate";
import MemberCard from "./components/MemberCard";
import ExcelExporter from "./components/ExcelExporter";
import AdminPanel from "./components/AdminPanel";

const KEYWORD_SUGGESTIONS = [
  "대통령", "국회", "시의원", "대표", "원장", "보좌관", "교수", "공무원", "법률", "작가", "연구원", "협회"
];

export default function App() {
  // Session Access state
  const [accessLevel, setAccessLevel] = useState<"none" | "user" | "admin">("none");
  
  // Storage states
  const [members, setMembers] = useState<Member[]>([]);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    accessPasswordHash: DEFAULT_ACCESS_SHA256,
    adminPasswordHash: DEFAULT_ADMIN_SHA256,
    isAccessPasswordSet: true,
    isAdminPasswordSet: true,
  });

  // UI state filters
  const [activeCategory, setActiveCategory] = useState<string>("전체");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Modal states
  const [showExporter, setShowExporter] = useState<boolean>(false);
  const [showAdminController, setShowAdminController] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Elevation state (for elevating "user" to "admin")
  const [elevationPass, setElevationPass] = useState<string>("");
  const [showElevationModal, setShowElevationModal] = useState<boolean>(false);
  const [elevationError, setElevationError] = useState<string>("");

  // --- 1. Load data from LocalStorage on mount ---
  useEffect(() => {
    // A. Initialize configuration
    const storedSec = localStorage.getItem("citizen_security_config");
    if (storedSec) {
      try {
        setSecurityConfig(JSON.parse(storedSec));
      } catch (e) {
        console.error("Failed to parse security config", e);
      }
    } else {
      // First-time fallback initialization
      const initialSec = {
        accessPasswordHash: DEFAULT_ACCESS_SHA256,
        adminPasswordHash: DEFAULT_ADMIN_SHA256,
        isAccessPasswordSet: true,
        isAdminPasswordSet: true,
      };
      localStorage.setItem("citizen_security_config", JSON.stringify(initialSec));
      setSecurityConfig(initialSec);
    }

    // B. Initialize members list
    const storedMembers = localStorage.getItem("citizen_members_data");
    if (storedMembers) {
      try {
        setMembers(JSON.parse(storedMembers));
      } catch (e) {
        console.error("Failed to parse members data", e);
        setMembers(INITIAL_MEMBERS);
      }
    } else {
      // Seed initial PDF-extracted members list
      localStorage.setItem("citizen_members_data", JSON.stringify(INITIAL_MEMBERS));
      setMembers(INITIAL_MEMBERS);
    }

    // C. Auto-restore session within current reload tab if they were active
    const activeSession = sessionStorage.getItem("citizen_session_level");
    if (activeSession === "user" || activeSession === "admin") {
      setAccessLevel(activeSession);
    }
  }, []);

  // --- 2. Action Handlers ---
  
  // Gate access success
  const handleGrantAccess = (granted: "user" | "admin") => {
    setAccessLevel(granted);
    sessionStorage.setItem("citizen_session_level", granted);
  };

  // Secure logout
  const handleLogout = () => {
    setAccessLevel("none");
    sessionStorage.removeItem("citizen_session_level");
    setShowAdminController(false);
    setShowElevationModal(false);
    alert("시민주권위원회 보안 세션이 정상적으로 종료되어 안전하게 로그아웃되었습니다.");
  };

  // CRUD: Add dynamic member
  const handleAddMember = (newMemberData: Omit<Member, "id">) => {
    const freshId = `m_${Date.now()}`;
    const freshMember: Member = {
      id: freshId,
      ...newMemberData
    };
    const updated = [freshMember, ...members];
    setMembers(updated);
    localStorage.setItem("citizen_members_data", JSON.stringify(updated));
  };

  // CRUD: Update Member Info
  const handleUpdateMember = (updatedMemberField: Member) => {
    const updated = members.map(m => m.id === updatedMemberField.id ? updatedMemberField : m);
    setMembers(updated);
    localStorage.setItem("citizen_members_data", JSON.stringify(updated));
  };

  // CRUD: Delete member
  const handleDeleteMember = (targetId: string) => {
    const updated = members.filter(m => m.id !== targetId);
    setMembers(updated);
    localStorage.setItem("citizen_members_data", JSON.stringify(updated));
  };

  // Security: Update the system passwords
  const handleUpdatePasscodes = async (accessPass: string, adminPass: string) => {
    const updatedConfig = { ...securityConfig };
    
    if (accessPass) {
      const accessHashVal = await hashPasscode(accessPass);
      updatedConfig.accessPasswordHash = accessHashVal;
    }
    
    if (adminPass) {
      const adminHashVal = await hashPasscode(adminPass);
      updatedConfig.adminPasswordHash = adminHashVal;
    }

    setSecurityConfig(updatedConfig);
    localStorage.setItem("citizen_security_config", JSON.stringify(updatedConfig));
  };

  // Elevate from observer level "user" to "admin"
  const handleElevateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setElevationError("");

    if (!elevationPass.trim()) {
      setElevationError("관리자 비밀번호를 입력해 주세요.");
      return;
    }

    const hashed = await hashPasscode(elevationPass.trim());
    if (hashed === securityConfig.adminPasswordHash) {
      handleGrantAccess("admin");
      setShowElevationModal(false);
      setElevationPass("");
      alert("관리자 권한 인증 성공! 위원 제어 및 보안 갱신 기능이 활성화되었습니다.");
    } else {
      setElevationError("비밀번호 검증에 실패했습니다. 올바른 관리자 권한 코드를 제공하십시오.");
    }
  };

  // --- 3. Structured Filter & Suggestion Engine ---
  
  const getFilteredMembers = () => {
    let list = [...members];

    // Category filtering
    if (activeCategory !== "전체") {
      list = list.filter(m => m.category === activeCategory);
    }

    // Keyword & Name & Phone comprehensive search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(m => {
        const matchesName = m.name?.toLowerCase().includes(q);
        const matchesPhone = m.phone?.replace(/[-]/g, "").includes(q.replace(/[-]/g, ""));
        const matchesRole = m.role?.toLowerCase().includes(q);
        const matchesCareer = m.career?.toLowerCase().includes(q);
        const matchesNote = m.note?.toLowerCase().includes(q);
        
        return matchesName || matchesPhone || matchesRole || matchesCareer || matchesNote;
      });
    }

    // Sort by serial number to match initial PDF ordering gracefully
    return list.sort((a, b) => (a.serialNo || 999) - (b.serialNo || 999));
  };

  const filteredMembers = getFilteredMembers();

  // Statistics summaries
  const totalCount = members.length;
  const filteredCount = filteredMembers.length;
  const activeCount = members.filter(m => !m.note?.includes("사의")).length;
  const resignedCount = members.filter(m => m.note?.includes("사의") || m.role?.includes("사의")).length;

  return (
    <div id="full-page-container" className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      
      {/* If access level is NONE, show the access gate lock */}
      {accessLevel === "none" ? (
        <AccessGate 
          accessHash={securityConfig.accessPasswordHash}
          adminHash={securityConfig.adminPasswordHash}
          onGrantAccess={handleGrantAccess}
        />
      ) : (
        <>
          {/* Header Bar */}
          <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800 backdrop-blur-md bg-opacity-95">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              
              {/* Logo / Badge */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-xl">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight">시민주권위원회 위원 수록</h1>
                  <p className="text-[10px] text-slate-400 font-mono">인수위원회 및 자문위원 통합 관리 명부 v1.4</p>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Security Mode Indicator */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs">
                  {accessLevel === "admin" ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-emerald-400">관리자 모드</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="font-semibold text-blue-400">조회 전용 모드</span>
                    </>
                  )}
                </div>

                {/* Main Control Actions */}
                <button
                  type="button"
                  id="export-btn-click"
                  onClick={() => setShowExporter(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>엑셀 내보내기</span>
                </button>

                {accessLevel === "admin" ? (
                  <button
                    type="button"
                    id="admin-panel-toggle"
                    onClick={() => {
                      setEditingMember(null);
                      setShowAdminController(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>통합 제어실</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    id="elevate-prompt-btn"
                    onClick={() => setShowElevationModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition"
                  >
                    <Unlock className="w-3.5 h-3.5 text-blue-400" />
                    <span>관리자 권한 인증</span>
                  </button>
                )}

                <button
                  type="button"
                  id="logout-btn-click"
                  onClick={handleLogout}
                  className="p-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg transition border border-slate-700"
                  title="안전 로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          {/* Quick Statistics Banner */}
          <section className="bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="p-4 bg-slate-50 dark:bg-slate-800/55 rounded-xl border border-slate-200/50 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">전체 등록 위원</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{totalCount}명</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/55 rounded-xl border border-slate-200/50 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">현임 활동위원</p>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{activeCount}명</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/55 rounded-xl border border-slate-200/50 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">사의 위원</p>
                  <p className="text-2xl font-black text-rose-500 shrink mt-1">{resignedCount}명</p>
                </div>

                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/15 rounded-xl border border-blue-200/40 text-center">
                  <p className="text-xs text-blue-600 dark:text-blue-400">검색 조건 부합 목록</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{filteredCount}명</p>
                </div>

              </div>
            </div>
          </section>

          {/* Main Content Workspace */}
          <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            
            {/* Search inputs & Category Filters Block */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 mb-8 shadow-sm">
              
              {/* Comprehensive Search Field */}
              <div className="relative mb-5">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  id="main-directory-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="위원 성명, 전화번호, 혹은 직무/경력 키워드를 검색하세요 (예: 최현덕, 국회, 대표, 4767)"
                  className="w-full pl-12 pr-10 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Suggestive Core Career tags */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  대표 키워드 제안:
                </span>
                {KEYWORD_SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearchQuery(tag)}
                    className={`text-xs px-2.5 py-1 rounded-md border font-medium transition ${
                      searchQuery === tag
                        ? "bg-slate-800 text-white border-slate-800 dark:bg-slate-700 dark:border-slate-600"
                        : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>

              {/* Classification Category Tab Buttons */}
              <div className="border-t border-slate-100 dark:border-slate-700/80 pt-5">
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                  위원회 분과구분 필터링
                </span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES_LIST.map((cat) => {
                    const isActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        id={`category-tab-${cat}`}
                        onClick={() => setActiveCategory(cat)}
                        className={`text-xs px-3.5 py-2.5 rounded-lg border font-semibold tracking-tight transition cursor-pointer ${
                          isActive
                            ? "bg-blue-600 border-blue-600 text-white font-extrabold shadow-sm shadow-blue-500/20"
                            : "bg-white hover:bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-250 dark:border-slate-750"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Members Cardboard Grid display */}
            {filteredMembers.length > 0 ? (
              <motion.div 
                id="members-directory-grid"
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredMembers.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      isAdminMode={accessLevel === "admin"}
                      onEdit={(m) => {
                        setEditingMember(m);
                        setShowAdminController(true);
                      }}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div id="no-search-results" className="text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-16 px-6 shadow-sm">
                <AlertTriangle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">조건에 맞는 위원이 없습니다</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                  검색어 <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-blue-600 font-semibold">"{searchQuery}"</span>을(를) 포함하거나 해당 분과구분에 부합하는 상세 명단 내역이 존재하지 않습니다. 다른 검색어로 조회해 주세요.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("전체");
                  }}
                  className="mt-5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
                >
                  필터 초기화
                </button>
              </div>
            )}

          </main>

          {/* Footer of applet */}
          <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs space-y-2">
              <p className="font-semibold text-slate-300">© 2026 시민주권위원회 인수위원회 & 자문위원회 명부 보안 시스템.</p>
              <p>본 사이트의 기재 위원 연락처 및 경력 정보는 공무 목적 이외의 용도로 상호 전재 및 상업적 유출을 금합니다.</p>
              <p className="text-[10px] text-slate-550">시스템은 SHA-256 비가역 암호화 해시 및 세션 세이프가드로 원천 보호되고 있습니다.</p>
            </div>
          </footer>

          {/* ABSOLUTE MODAL COORD REGISTRY */}

          {/* A. Excel Export Modal Gate */}
          {showExporter && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
              <div className="animate-in fade-in zoom-in duration-200">
                <ExcelExporter 
                  dataToExport={filteredMembers}
                  onClose={() => setShowExporter(false)}
                />
              </div>
            </div>
          )}

          {/* B. Admin Panel Controller Modal */}
          {showAdminController && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm">
              <div className="animate-in fade-in zoom-in duration-250 w-full max-w-5xl">
                <AdminPanel
                  members={members}
                  onAddMember={handleAddMember}
                  onUpdateMember={handleUpdateMember}
                  onDeleteMember={handleDeleteMember}
                  onUpdatePasscodes={handleUpdatePasscodes}
                  onClose={() => {
                    setShowAdminController(false);
                    setEditingMember(null);
                  }}
                  securityConfig={securityConfig}
                  editingMember={editingMember}
                  setEditingMember={setEditingMember}
                />
              </div>
            </div>
          )}

          {/* C. Elevation Passcode input modal */}
          {showElevationModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
              <div className="animate-in fade-in zoom-in duration-200 max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">관리자 특수 권한 승인</h3>
                    <p className="text-[11px] text-slate-400">데이터 조작 권한 획득을 위해 관리자 암호를 입력하십시오</p>
                  </div>
                </div>

                <form onSubmit={handleElevateAccess} className="space-y-4">
                  {elevationError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-lg text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{elevationError}</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="elevation-pass-input" className="block text-xs font-semibold text-slate-400 mb-1">관리자 비밀번호</label>
                    <input
                      id="elevation-pass-input"
                      type="password"
                      value={elevationPass}
                      onChange={(e) => setElevationPass(e.target.value)}
                      placeholder="초기 세팅: admin2026"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-center font-mono font-bold tracking-widest text-slate-900 dark:text-slate-100"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2.5 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowElevationModal(false);
                        setElevationPass("");
                        setElevationError("");
                      }}
                      className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-205 rounded-lg"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                      승인 요청
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </>
      )}

    </div>
  );
}
