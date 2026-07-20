// ponytail: generic skeleton loader — size via className, animasi via CSS
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[var(--color-text-secondary)]/10 ${className}`}
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="block">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="mt-3 space-y-2 px-0.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
