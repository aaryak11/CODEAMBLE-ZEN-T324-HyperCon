import { ShieldCheck, AlertCircle, Info } from "lucide-react";

export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-lg shadow-brutal border-3 border-ink bg-ink text-base flex items-center gap-2.5 text-xs font-semibold animate-fade-in-up`}
    >
      {toast.type === "error" ? (
        <AlertCircle className="w-4 h-4 text-accent" />
      ) : toast.type === "info" ? (
        <Info className="w-4 h-4 text-emerald-400" />
      ) : (
        <ShieldCheck className="w-4 h-4 text-accent" />
      )}
      <span>{toast.message}</span>
    </div>
  );
}
