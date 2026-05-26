import Link from 'next/link';

interface Props {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({ title, description, actionLabel, actionHref }: Props) {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🐕</div>
      <h2 className="text-xl font-semibold text-stone-900 mb-2">{title}</h2>
      {description && <p className="text-stone-600 mb-6">{description}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-block px-6 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-dark"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
