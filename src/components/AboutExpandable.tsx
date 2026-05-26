'use client';

import { useState } from 'react';

export default function AboutExpandable({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 280;

  if (!isLong) {
    return <p className="text-stone-600 leading-relaxed whitespace-pre-line">{text}</p>;
  }

  return (
    <div>
      <p
        className={`text-stone-600 leading-relaxed whitespace-pre-line ${
          expanded ? '' : 'line-clamp-4'
        }`}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 text-sm font-semibold text-brand hover:text-brand-dark"
      >
        {expanded ? '접기' : '더 보기'}
      </button>
    </div>
  );
}
