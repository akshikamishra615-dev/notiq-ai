import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Key, 
  CheckCircle2, 
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateSecurityAuditReport } from '../services/securityService';

export const SecurityAuditModal: React.FC = () => {
  const { isSecurityModalOpen, setIsSecurityModalOpen, currentUser } = useAuth();

  if (!isSecurityModalOpen) return null;

  const report = generateSecurityAuditReport();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#141028] light:bg-white border border-white/15 light:border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 light:text-slate-900 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 light:border-slate-200 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white light:text-slate-900">
                Cryptographic Security Audit
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600">Zero-Knowledge & Client-Side Encryption Report</p>
            </div>
          </div>
          <button
            onClick={() => setIsSecurityModalOpen(false)}
            className="p-2 rounded-xl bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Highlights */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 light:text-slate-600 block mb-1">Cipher Algorithm</span>
            <p className="text-sm font-extrabold text-emerald-400 light:text-emerald-600 flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              <span>AES-256-GCM</span>
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 light:text-slate-600 block mb-1">Key Derivation</span>
            <p className="text-sm font-extrabold text-brand-pink flex items-center gap-1.5">
              <Key className="w-4 h-4" />
              <span>PBKDF2 100K Rnds</span>
            </p>
          </div>
        </div>

        {/* Active Vault Namespace */}
        <div className="p-4 rounded-2xl bg-brand-purple/15 light:bg-purple-50 border border-brand-purple/30 light:border-purple-200 text-xs space-y-1.5 mb-6">
          <div className="flex items-center justify-between font-bold text-brand-pink">
            <span className="flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>Active User Storage Vault:</span>
            </span>
            <span className="font-mono bg-black/40 light:bg-slate-200 px-2 py-0.5 rounded-md text-[10px] text-emerald-300 light:text-emerald-700">
              SECURE
            </span>
          </div>
          <p className="text-slate-300 light:text-slate-700 font-mono text-[11px] truncate">
            Namespace: sticky_ai_vault_{currentUser?.id}
          </p>
          <p className="text-[10px] text-slate-400 light:text-slate-600 leading-relaxed">
            All documents, notes, bullets, and quiz history are encrypted prior to being committed to browser storage. Cleartext data resides solely in volatile memory.
          </p>
        </div>

        {/* Security Checklist */}
        <div className="space-y-2.5 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 light:text-slate-700">
            Security Checklist & Verifications
          </h4>
          <div className="space-y-2">
            {report.securityChecks.map((item: { label: string; passed: boolean; detail: string }, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/[0.03] light:bg-slate-50 border border-white/5 light:border-slate-200 flex items-start gap-2.5 text-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 light:text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white light:text-slate-900">{item.label}</p>
                  <p className="text-[11px] text-slate-400 light:text-slate-600 leading-relaxed mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-white/10 light:border-slate-200">
          <button
            onClick={() => setIsSecurityModalOpen(false)}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-pink shadow-md"
          >
            Close Audit Report
          </button>
        </div>

      </div>
    </div>
  );
};
