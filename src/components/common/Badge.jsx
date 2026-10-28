import React from 'react';
import { STATUS_CONFIG } from '../../utils/formatters';

export function Badge({ status, label, variant = 'default', size = 'sm' }) {
  const config = STATUS_CONFIG[status];
  const displayLabel = label || config?.label || status;
  const classes = config?.bg || 'bg-slate-100 text-slate-700 border-slate-200/80';

  const sizeClasses =
    size === 'xs'
      ? 'px-2 py-0.5 text-[11px] leading-4'
      : 'px-2.5 py-0.5 text-[11.5px] leading-4';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold tracking-[-0.01em] rounded-md border shadow-[0_1px_1px_rgba(15,23,42,0.02)] whitespace-nowrap ${classes} ${sizeClasses}`}
    >
      {config?.dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />}
      {displayLabel}
    </span>
  );
}
