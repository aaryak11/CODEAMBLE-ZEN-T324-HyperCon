export function StoreSkeleton() {
  return (
    <div className="w-72 shrink-0 bg-surface border-3 border-ink rounded-lg p-4 shadow-brutal animate-pulse space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-ink/20 border-2 border-ink rounded-md w-3/4" />
          <div className="h-3 bg-ink/10 border-2 border-ink rounded-md w-1/2" />
        </div>
        <div className="w-10 h-5 bg-accentSoft border-2 border-ink rounded-md" />
      </div>
      <div className="h-3 bg-ink/10 border-2 border-ink rounded-md w-2/3" />
      <div className="pt-3 border-t-2 border-ink/10 flex gap-2">
        <div className="h-8 bg-accentSoft border-2 border-ink rounded-lg flex-1" />
      </div>
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="bg-surface border-3 border-ink rounded-lg p-5 shadow-brutal animate-pulse space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-accentSoft border-2 border-ink rounded-lg shrink-0" />
          <div className="space-y-2">
            <div className="h-5 bg-ink/20 border-2 border-ink rounded-md w-48" />
            <div className="h-3.5 bg-ink/10 border-2 border-ink rounded-md w-32" />
            <div className="h-3 bg-ink/10 border-2 border-ink rounded-md w-40" />
          </div>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3">
          <div className="h-6 bg-ink/20 border-2 border-ink rounded-md w-20" />
          <div className="h-8 bg-accentSoft border-2 border-ink rounded-lg w-28" />
        </div>
      </div>
    </div>
  );
}

export function CheckoutProcessingSkeleton() {
  return (
    <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-ink border-t-accent animate-spin" />
      </div>
      <div className="space-y-1">
        <h4 className="font-bold font-display text-ink text-base">Processing Secured Payment</h4>
        <p className="text-xs text-ink/70 font-medium max-w-xs leading-relaxed">
          Verifying partner store stock reservation and dispatch status...
        </p>
      </div>
    </div>
  );
}

export function StoreDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
      <div className="flex flex-col md:flex-row gap-6 bg-surface border-3 border-ink p-6 rounded-xl shadow-brutal">
        <div className="w-full md:w-1/3 h-48 bg-accentSoft border-3 border-ink rounded-lg" />
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-ink/20 w-3/4 rounded" />
          <div className="h-4 bg-ink/10 w-1/2 rounded" />
          <div className="h-20 bg-base border-2 border-ink rounded-lg mt-4" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-6 bg-ink/20 w-48 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <StoreSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
