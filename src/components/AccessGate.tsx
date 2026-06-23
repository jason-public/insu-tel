import React, { useState } from "react";
import { Lock, Shield, Eye, EyeOff, AlertCircle } from "lucide-react";
import { verifyPasscode } from "../utils/crypto";

interface AccessGateProps {
  accessHash: string;
  adminHash: string;
  onGrantAccess: (role: "user" | "admin") => void;
}

export default function AccessGate({ accessHash, adminHash, onGrantAccess }: AccessGateProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Check Admin Passcode first
      const isAdmin = await verifyPasscode(password, adminHash);
      if (isAdmin) {
        onGrantAccess("admin");
        setIsLoading(false);
        return;
      }

      // Check General Access Passcode
      const isUser = await verifyPasscode(password, accessHash);
      if (isUser) {
        onGrantAccess("user");
        setIsLoading(false);
        return;
      }

      setError("올바르지 않은 비밀번호입니다. 다시 확인해 주세요.");
    } catch (err) {
      console.error(err);
      setError("보안 시스템 검증 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="access-gate" className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
        
        {/* Top Banner Accent */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700" />

        <div className="p-8 sm:p-10">
          {/* Lock Icon Visual */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
              <Lock className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              시민주권위원회
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              인수위원 및 자문위원 명부 시스템
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-full text-xs text-slate-600 dark:text-slate-300 mt-3 border border-slate-200 dark:border-slate-700">
              <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              보안 인증 필요
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label 
                htmlFor="password-input" 
                className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2"
              >
                접속 비밀번호
              </label>
              
              <div className="relative rounded-lg shadow-sm">
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="초기 설정 비밀번호를 입력하세요"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center text-lg tracking-widest placeholder:tracking-normal placeholder:text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div id="access-error-msg" className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-lg text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              id="submit-access-pass"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-semibold rounded-lg shadow transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50"
            >
              {isLoading ? "접속 승인 중..." : "시스템 접속하기"}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
