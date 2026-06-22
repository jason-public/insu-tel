import React, { useState } from "react";
import { Download, CheckSquare, Square, FileText, AlertCircle, X } from "lucide-react";

interface ExcelExporterProps {
  dataToExport: any[];
  onClose?: () => void;
}

interface ColItem {
  label: string;
  checked: boolean;
  key: string;
}

export default function ExcelExporter({ dataToExport, onClose }: ExcelExporterProps) {
  // Export choices state
  const [columns, setColumns] = useState<Record<string, ColItem>>({
    serialNo: { label: "순번", checked: true, key: "serialNo" },
    category: { label: "구분 (분과위원회)", checked: true, key: "category" },
    role: { label: "직위/역할", checked: true, key: "role" },
    name: { label: "성명", checked: true, key: "name" },
    phone: { label: "전화번호", checked: true, key: "phone" },
    career: { label: "대표경력", checked: true, key: "career" },
    note: { label: "비고/특이사항", checked: true, key: "note" },
  });

  const [fileName, setFileName] = useState("시민주권위원회_인수위원명수_목록");

  const toggleColumn = (colKey: keyof typeof columns) => {
    setColumns(prev => ({
      ...prev,
      [colKey]: {
        ...prev[colKey],
        checked: !prev[colKey].checked
      }
    }));
  };

  const selectAll = (checked: boolean) => {
    setColumns(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(k => {
        updated[k as keyof typeof columns].checked = checked;
      });
      return updated;
    });
  };

  const handleExport = () => {
    // Collect active keys
    const activeCols = (Object.values(columns) as ColItem[]).filter(c => c.checked);
    if (activeCols.length === 0) {
      alert("출력할 열을 하나 이상 선택해 주세요.");
      return;
    }

    // Build header row
    const headers = activeCols.map(c => c.label).join(",");
    
    // Build data rows
    const csvRows = dataToExport.map(row => {
      return activeCols.map(col => {
        const val = row[col.key] || "";
        // Excel CSV values containing commas or double quotes must be safely enclosed in double quotes
        // Also clean up any newlines inside to space or safe character so it behaves well as a single row cell
        const cleanedStr = String(val)
          .replace(/"/g, '""') // Escape double quotes
          .replace(/\r?\n/g, "  "); // Flatten inline linebreaks for Excel cleanliness
        return `"${cleanedStr}"`;
      }).join(",");
    });

    // Create Excel friendly UTF-8 CSV with Byte Order Mark (BOM) \uFEFF to prevent Korean character corruption
    const csvContent = "\uFEFF" + [headers, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    
    // Append timestamp to prevent cached overwrites
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `${fileName.trim() || "인수위_명단"}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onClose) onClose();
  };

  return (
    <div id="excel-exporter-panel" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-xl max-w-lg w-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              엑셀(CSV) 선택 내보내기
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              총 <span className="font-semibold text-emerald-600 dark:text-emerald-400">{dataToExport.length}명</span>의 검색 결과를 내보냅니다.
            </p>
          </div>
        </div>
        {onClose && (
          <button 
            id="close-export-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Input File Name */}
      <div className="mb-5">
        <label htmlFor="file-name-input" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
          저장될 파일 명칭
        </label>
        <div className="flex rounded-md shadow-sm">
          <input
            id="file-name-input"
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="시민주권위원회_인수위원_목록"
          />
          <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium font-mono">
            .csv
          </span>
        </div>
      </div>

      {/* Selection Columns Control */}
      <div className="space-y-3 mb-6 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-200/50 dark:border-slate-700/50 p-4 rounded-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/60 font-medium text-xs text-slate-500 dark:text-slate-400">
          <span>내보낼 데이터 열 선택</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => selectAll(true)}
              className="hover:text-slate-700 dark:hover:text-slate-200 hover:underline"
            >
              전체 선택
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => selectAll(false)}
              className="hover:text-slate-700 dark:hover:text-slate-200 hover:underline"
            >
              전체 해제
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5">
          {(Object.entries(columns) as [string, ColItem][]).map(([key, item]) => {
            const isChecked = item.checked;
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleColumn(key as keyof typeof columns)}
                className={`flex items-center gap-2.5 px-3 py-2 border rounded-lg text-left transition text-xs font-medium w-full ${
                  isChecked
                    ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                }`}
              >
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300 dark:text-slate-500" />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Helper Box to tell Excel formatting compatibility */}
      <div className="bg-blue-50/40 dark:bg-blue-950/10 border border-blue-200/60 dark:border-blue-900/40 p-3 rounded-lg text-xs text-blue-800 dark:text-blue-300 flex gap-2 mb-6">
        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          * <strong>BOM(Byte Order Mark)</strong> 기술이 적용되어, Microsoft Excel에서 파일을 더블 클릭하여 실행할 시 <strong>한글 인코딩 깨짐 없이 깨끗하게 원클릭으로 정렬</strong>되어 출력됩니다.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-end">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition"
          >
            취소
          </button>
        )}
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm hover:shadow transition"
        >
          <FileText className="w-4 h-4" />
          <span>엑셀 파일 다운로드</span>
        </button>
      </div>
    </div>
  );
}
