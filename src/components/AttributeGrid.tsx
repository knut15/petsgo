import type { ReactNode } from 'react';

export interface Attribute {
  icon: ReactNode;
  label: string;
  value: string;
}

export default function AttributeGrid({ items }: { items: Attribute[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 p-4 rounded-xl border border-stone-200 bg-white"
        >
          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-lg text-stone-600 shrink-0">
            {item.icon}
          </div>
          <div className="min-w-0">
            <div className="text-xs text-stone-500 mb-0.5">{item.label}</div>
            <div className="text-sm font-semibold text-stone-900 truncate">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
