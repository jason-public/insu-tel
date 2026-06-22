import React from "react";
import { Phone, User, Award, FileText, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import { Member } from "../types";

interface MemberCardProps {
  key?: string;
  member: Member;
  onEdit?: (member: Member) => void;
  isAdminMode: boolean;
}

export default function MemberCard({ member, onEdit, isAdminMode }: MemberCardProps) {
  // Determine division-specific colors for tags
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "인수위원회":
        return "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/50";
      case "기획자치분과":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/50";
      case "미래경제분과":
        return "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50";
      case "도시교통환경분과":
      case "도시교통_(공주특위)":
        return "bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/50";
      case "복지문화교육분과":
        return "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50";
      case "재정혁신특위":
        return "bg-teal-50 text-teal-700 border-teal-200/60 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-900/50";
      case "대변인":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900/50";
      case "사의/기타":
        return "bg-slate-100 text-slate-600 border-slate-300/60 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/60 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800/50";
    }
  };

  const isResigned = member.note?.includes("사의") || member.role?.includes("사의");
  const isCheckRequired = member.note?.includes("확인필요") || member.role?.includes("확인필요");

  return (
    <motion.div
      id={`member-card-${member.id}`}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`relative flex flex-col justify-between bg-white dark:bg-slate-800 rounded-xl shadow-md border overflow-hidden p-6 hover:shadow-lg transition-all duration-250 ${
        isResigned 
          ? "border-rose-200/80 bg-rose-50/10 dark:border-rose-950/40 opacity-80" 
          : isCheckRequired
          ? "border-amber-200 bg-amber-50/10 dark:border-amber-950/40"
          : "border-slate-100 dark:border-slate-700"
      }`}
    >
      <div>
        {/* Card Header: Category & Role Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap gap-1.5">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryColor(member.category)}`}>
              {member.category}
            </span>
            <span className="text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-full">
              {member.role}
            </span>
          </div>
          
          <span className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500">
            No. {member.serialNo || "-"}
          </span>
        </div>

        {/* Name and Indicators */}
        <div className="flex items-baseline justify-between mb-3 gap-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            {member.name}
          </h3>
          
          {isResigned && (
            <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] font-bold rounded uppercase tracking-wider">
              사의 표명
            </span>
          )}
          {isCheckRequired && (
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded flex items-center gap-1 uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3" /> 확인 필요
            </span>
          )}
        </div>

        {/* Phone Click-to-Call Section */}
        <div className="mb-4">
          {member.phone ? (
            <a
              id={`call-${member.id}`}
              href={`tel:${member.phone}`}
              className="inline-flex items-center gap-2 group text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/10 dark:hover:bg-blue-950/30 px-3 py-1.5 rounded-lg border border-blue-100/50 dark:border-blue-950/30 transition-colors w-full"
              title="클릭 시 바로 연결됩니다"
            >
              <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-mono tracking-wider">{member.phone}</span>
              <span className="text-[10px] text-blue-400 dark:text-blue-500 ml-auto group-hover:underline font-normal">
                바로 통화
              </span>
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-200/40 dark:border-slate-800/40 w-full font-mono italic">
              <Phone className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span>전화번호 정보 없음</span>
            </div>
          )}
        </div>

        {/* Representative Career Experience (대표경력) */}
        <div className="space-y-1 text-slate-600 dark:text-slate-300 text-xs">
          <div className="flex items-center gap-1 font-semibold text-[11px] text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>주요 경력 사항</span>
          </div>
          <div className="pl-1 space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
            {member.career ? (
              member.career.split("\n").map((line, idx) => {
                const cleaned = line.replace(/^[ㆍ\-\*\s]+/, "").trim();
                return (
                  <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-blue-500 dark:text-blue-400 font-bold shrink-0 mt-0.5">ㆍ</span>
                    <span className="break-all">{cleaned}</span>
                  </div>
                );
              })
            ) : (
              <span className="italic text-slate-400">등록된 상세 경력 사항이 없습니다.</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Bigo and Admin controls */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2.5">
        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
          {member.note ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium">
              비고: {member.note}
            </span>
          ) : (
            <span className="text-slate-350 dark:text-slate-650">특이 사항 없음</span>
          )}
        </div>

        {isAdminMode && onEdit && (
          <button
            type="button"
            id={`edit-btn-${member.id}`}
            onClick={() => onEdit(member)}
            className="text-xs font-semibold px-2.5 py-1 bg-slate-150 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-600 transition"
          >
            정보 수정
          </button>
        )}
      </div>
    </motion.div>
  );
}
