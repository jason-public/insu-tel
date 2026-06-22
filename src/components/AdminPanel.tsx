import React, { useState } from "react";
import { Plus, Save, Trash2, Key, Shield, UserPlus, AlertCircle, CheckCircle, RefreshCcw, Lock } from "lucide-react";
import { Member, SecurityConfig, CATEGORIES_LIST } from "../types";
import { hashPasscode } from "../utils/crypto";

interface AdminPanelProps {
  members: Member[];
  onAddMember: (member: Omit<Member, "id">) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onUpdatePasscodes: (accessPass: string, adminPass: string) => void;
  onClose: () => void;
  securityConfig: SecurityConfig;
  editingMember: Member | null;
  setEditingMember: (member: Member | null) => void;
}

export default function AdminPanel({
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onUpdatePasscodes,
  onClose,
  securityConfig,
  editingMember,
  setEditingMember,
}: AdminPanelProps) {
  // Tabs: "members-manage" | "security-manage"
  const [activeTab, setActiveTab] = useState<"members-manage" | "security-manage">("members-manage");

  // Member form state
  const [formData, setFormData] = useState({
    serialNo: editingMember ? String(editingMember.serialNo) : String(members.length + 1),
    category: editingMember ? editingMember.category : "기획자치분과",
    role: editingMember ? editingMember.role : "자문위원",
    name: editingMember ? editingMember.name : "",
    phone: editingMember ? editingMember.phone : "",
    career: editingMember ? editingMember.career : "",
    note: editingMember ? editingMember.note : "",
  });

  // Security passcodes form state
  const [secForm, setSecForm] = useState({
    currentAdminPass: "",
    newAccessPass: "",
    confirmAccessPass: "",
    newAdminPass: "",
    confirmAdminPass: "",
  });

  const [secError, setSecError] = useState("");
  const [secSuccess, setSecSuccess] = useState("");

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("성명을 입력해 주세요.");
      return;
    }

    const payload = {
      serialNo: Number(formData.serialNo) || (members.length + 1),
      category: formData.category,
      role: formData.role,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      career: formData.career.trim(),
      note: formData.note.trim(),
    };

    if (editingMember) {
      onUpdateMember({
        ...editingMember,
        ...payload,
      });
      alert("위원 정보가 안전하게 수정되었습니다.");
      setEditingMember(null);
    } else {
      onAddMember(payload);
      alert("새로운 위원이 추가 등록되었습니다.");
    }

    // Reset form after add
    setFormData({
      serialNo: String(members.length + 2),
      category: "기획자치분과",
      role: "자문위원",
      name: "",
      phone: "",
      career: "",
      note: "",
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`진짜로 ${name} 위원의 정보를 완전히 제거하시겠습니까? 관련 데이터가 소멸됩니다.`)) {
      onDeleteMember(id);
      alert("성공적으로 삭제되었습니다.");
      if (editingMember && editingMember.id === id) {
        setEditingMember(null);
      }
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecError("");
    setSecSuccess("");

    if (!secForm.currentAdminPass) {
      setSecError("인수위 보안 승인을 위해 현재 관리자 비밀번호를 반드시 입력해야 합니다.");
      return;
    }

    // Verify current admin pass using hashing matches
    const currentAdminHash = await hashPasscode(secForm.currentAdminPass);
    if (currentAdminHash !== securityConfig.adminPasswordHash) {
      setSecError("입력하신 현재 관리자 비밀번호가 암호화 검증에서 일치하지 않습니다.");
      return;
    }

    let accessPassToUpdate = "";
    let adminPassToUpdate = "";

    // 1. Check access password update
    if (secForm.newAccessPass) {
      if (secForm.newAccessPass !== secForm.confirmAccessPass) {
        setSecError("새 일반 접속 비번과 확인 비비가 일치하지 않습니다.");
        return;
      }
      if (secForm.newAccessPass.length < 4) {
        setSecError("보안성을 높이기 위해 비밀번호는 최소 4글자 이상이어야 합니다.");
        return;
      }
      accessPassToUpdate = secForm.newAccessPass;
    }

    // 2. Check admin password update
    if (secForm.newAdminPass) {
      if (secForm.newAdminPass !== secForm.confirmAdminPass) {
        setSecError("새 관리자 비번과 확인 비번이 일치하지 않습니다.");
        return;
      }
      if (secForm.newAdminPass.length < 6) {
        setSecError("통상 관리용 비밀번호는 최소 6자 이상으로 설정하는 것을 강력 추천합니다.");
        return;
      }
      adminPassToUpdate = secForm.newAdminPass;
    }

    if (!accessPassToUpdate && !adminPassToUpdate) {
      setSecError("변경을 원하시는 새로운 승인 코드 또는 비번을 최소 하나 이상 입력해 주세요.");
      return;
    }

    try {
      onUpdatePasscodes(accessPassToUpdate, adminPassToUpdate);
      setSecSuccess("성공 완료! 시스템의 보안 해시 승인 코드가 안전하게 새로운 값으로 갱신되었습니다. 다음 로그인부터 적용됩니다.");
      setSecForm({
        currentAdminPass: "",
        newAccessPass: "",
        confirmAccessPass: "",
        newAdminPass: "",
        confirmAdminPass: "",
      });
    } catch (err) {
      setSecError("보안 갱신 처리 중 일시적인 시스템 에러가 발생했습니다.");
    }
  };

  return (
    <div id="admin-panel" className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 lg:p-8 max-w-5xl w-full max-h-[92vh] overflow-y-auto">
      {/* Top Banner and Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-5.5 h-5.5 text-blue-600 dark:text-blue-400" />
            통합 관리 제어실 (Admin Controller)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            인수위원회 위원들의 전체 명부 데이터 관리 및 시스템 전반의 핵심 보안 설정을 조율합니다.
          </p>
        </div>
        
        {/* Navigation Tab controls */}
        <div className="flex bg-slate-200/60 dark:bg-slate-800 p-1 rounded-lg">
          <button
            type="button"
            id="tab-manage-members"
            onClick={() => setActiveTab("members-manage")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "members-manage"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            위원 명무 추가/수정
          </button>
          <button
            type="button"
            id="tab-manage-security"
            onClick={() => setActiveTab("security-manage")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "security-manage"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            시스템 보안 승인 코드 관리
          </button>
        </div>
      </div>

      {activeTab === "members-manage" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Block: Add/Edit Form */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-md">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
              {editingMember ? (
                <>
                  <RefreshCcw className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-850 dark:text-slate-100">위원 정보 수정하기</h3>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-slate-850 dark:text-slate-100">신규 위원 추가 등록</h3>
                </>
              )}
            </div>

            <form onSubmit={handleMemberSubmit} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="form-serial" className="block text-slate-500 dark:text-slate-400 mb-1">순번</label>
                  <input
                    id="form-serial"
                    type="number"
                    value={formData.serialNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, serialNo: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-150"
                  />
                </div>
                <div>
                  <label htmlFor="form-category" className="block text-slate-500 dark:text-slate-400 mb-1">구분 (분과)</label>
                  <select
                    id="form-category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-150"
                  >
                    {CATEGORIES_LIST.filter(c => c !== "전체").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="form-name" className="block text-slate-500 dark:text-slate-400 mb-1">성명 (필수)</label>
                  <input
                    id="form-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="홍길동"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-150 font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="form-role" className="block text-slate-500 dark:text-slate-400 mb-1">직위</label>
                  <input
                    id="form-role"
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="자문위원"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-150"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="form-phone" className="block text-slate-500 dark:text-slate-400 mb-1">전화번호</label>
                <input
                  id="form-phone"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-150 font-mono tracking-wide"
                />
              </div>

              <div>
                <label htmlFor="form-career" className="block text-slate-500 dark:text-slate-400 mb-1">대표경력 (줄바꿈 가능)</label>
                <textarea
                  id="form-career"
                  rows={4}
                  value={formData.career}
                  onChange={(e) => setFormData(prev => ({ ...prev, career: e.target.value }))}
                  placeholder="ㆍ현) 시민단체 대표&#10;ㆍ전) 대통령비서실 비서관"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-150 leading-relaxed font-sans"
                />
              </div>

              <div>
                <label htmlFor="form-note" className="block text-slate-500 dark:text-slate-400 mb-1">비고 (특이사항)</label>
                <input
                  id="form-note"
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="사의, 청년, 확인필요 등 기재"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-150"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                {editingMember && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMember(null);
                      setFormData({
                        serialNo: String(members.length + 1),
                        category: "기획자치분과",
                        role: "자문위원",
                        name: "",
                        phone: "",
                        career: "",
                        note: "",
                      });
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold"
                  >
                    수정 취소
                  </button>
                )}
                <button
                  type="submit"
                  id="save-member-submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingMember ? "저장 완료" : "신규 등록"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Block: Members List with fast-actions */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-md flex flex-col">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
              현재 등록된 위원 명단 및 개별 관리 ({members.length}명)
            </h3>
            
            <div className="overflow-y-auto max-h-[50vh] pr-1 space-y-2 flex-grow">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-lg flex items-center justify-between gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {m.name}
                      </span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-medium">
                        {m.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        No. {m.serialNo}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-wider mt-1">
                      {m.phone || "연락처 정보 없음"} | {m.role}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      id={`list-edit-${m.id}`}
                      onClick={() => {
                        setEditingMember(m);
                        setFormData({
                          serialNo: String(m.serialNo),
                          category: m.category,
                          role: m.role,
                          name: m.name,
                          phone: m.phone,
                          career: m.career,
                          note: m.note,
                        });
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded transition"
                    >
                      편집
                    </button>
                    <button
                      type="button"
                      id={`list-delete-${m.id}`}
                      onClick={() => handleDelete(m.id, m.name)}
                      className="p-1 px-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-450 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded transition"
                      title="완전 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Tab: Security Settings */
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-md">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Lock className="w-5.5 h-5.5 text-blue-600 dark:text-blue-400 animate-bounce" />
            <h3 className="font-bold text-slate-850 dark:text-slate-100">보안성 강화용 비밀번호 설정 갱신</h3>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 p-3.5 rounded-lg mb-6 leading-relaxed">
            <h4 className="font-bold mb-1 font-sans">🛡️ 명부 보안 유지를 위한 안전성 수칙:</h4>
            <p>
              시행위원회 및 위원들의 직위와 연락처 명부는 외부에 불필요하게 직접 노출되지 않도록 강력하게 봉인 관리되어야 합니다. 수시로 비밀번호를 갱신해 주시면 침탈과 유출을 막을 수 있습니다.
            </p>
          </div>

          <form onSubmit={handleSecuritySubmit} className="space-y-6 text-xs max-w-xl mx-auto">
            {secError && (
              <div id="sec-error-msg" className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{secError}</span>
              </div>
            )}

            {secSuccess && (
              <div id="sec-success-msg" className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-450 rounded-lg flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{secSuccess}</span>
              </div>
            )}

            {/* Current admin pass confirm (Required gate!) */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
              <label 
                htmlFor="curr-admin-pass" 
                className="block font-bold text-slate-700 dark:text-slate-300"
              >
                현재 관리자 비밀번호 입력 (보안상 필수 검증)
              </label>
              <input
                id="curr-admin-pass"
                type="password"
                value={secForm.currentAdminPass}
                onChange={(e) => setSecForm(prev => ({ ...prev, currentAdminPass: e.target.value }))}
                placeholder="현재 설정되어 있는 관리자 비번을 입력해 인증을 통과하십시오"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-305 dark:border-slate-700 rounded-md font-sans tracking-widest placeholder:tracking-normal font-bold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box A: Access Password update */}
              <div className="p-4 border border-slate-200/75 dark:border-slate-700/80 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-1.5 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-slate-400" />
                  일반 사용자 조회 승인코드 변경
                </h4>
                <div>
                  <label htmlFor="new-access-pass" className="block text-slate-500 mb-1">새 일반 조회코드</label>
                  <input
                    id="new-access-pass"
                    type="password"
                    value={secForm.newAccessPass}
                    onChange={(e) => setSecForm(prev => ({ ...prev, newAccessPass: e.target.value }))}
                    placeholder="신 신규 조회 비번(최소 4자)"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-750 rounded"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-access-pass" className="block text-slate-500 mb-1">조회코드 확인</label>
                  <input
                    id="confirm-access-pass"
                    type="password"
                    value={secForm.confirmAccessPass}
                    onChange={(e) => setSecForm(prev => ({ ...prev, confirmAccessPass: e.target.value }))}
                    placeholder="조회 비번 다시 입력"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-750 rounded"
                  />
                </div>
              </div>

              {/* Box B: Admin password update */}
              <div className="p-4 border border-slate-200/75 dark:border-slate-700/80 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-1.5 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  관리자 비밀번호 변경
                </h4>
                <div>
                  <label htmlFor="new-admin-pass" className="block text-slate-500 mb-1">새 관리자 비밀번호</label>
                  <input
                    id="new-admin-pass"
                    type="password"
                    value={secForm.newAdminPass}
                    onChange={(e) => setSecForm(prev => ({ ...prev, newAdminPass: e.target.value }))}
                    placeholder="새 관리자 비밀번호 설정(최소 6자)"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-750 rounded"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-admin-pass" className="block text-slate-500 mb-1">관리자 비밀번호 확인</label>
                  <input
                    id="confirm-admin-pass"
                    type="password"
                    value={secForm.confirmAdminPass}
                    onChange={(e) => setSecForm(prev => ({ ...prev, confirmAdminPass: e.target.value }))}
                    placeholder="비밀번호 확인용 재입력"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-750 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-650 text-white font-bold rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>새로운 암호 세팅 저장하기</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Controller Footer closer */}
      <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg transition"
        >
          제어창 닫기 (Main 명부 화면으로)
        </button>
      </div>
    </div>
  );
}
