'use client'

// Tab filter horizontal (scrollable di mobile) — dipakai halaman Pesanan & Notifikasi.
export default function FilterTabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {tabs.map(t => {
        const active = value === t.id
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-warm)] ${
              active
                ? 'bg-[var(--color-text-primary)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {t.label}
            {typeof t.count === 'number' && (
              <span className={`tabular-nums ${active ? 'text-white/80' : 'text-[var(--color-text-secondary)]'}`}>
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
