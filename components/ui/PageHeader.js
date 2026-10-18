export default function PageHeader({ overline = 'Akun', title, description, action }) {
  return (
    <header className="mb-8 border-b border-[var(--color-bg-section)] pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
            {overline}
          </p>
          <h1 className="mt-2 font-[var(--font-display)] text-3xl tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    </header>
  )
}
