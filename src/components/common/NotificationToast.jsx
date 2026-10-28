import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export function NotificationToast() {
  const { toast } = useCrm();
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    error: 'bg-rose-50 border-rose-200 text-rose-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-bounce-short max-w-md shadow-xl rounded-xl border p-4 flex items-center gap-3 backdrop-blur-sm bg-white/95">
      {icons[toast.type] || icons.info}
      <p className="text-sm font-medium text-slate-800">{toast.message}</p>
    </div>
  );
}
