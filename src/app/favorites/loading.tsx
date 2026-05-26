export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐕</span>
            <span className="font-bold text-stone-900">PetTrip</span>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="h-4 w-20 bg-stone-200 rounded mb-2 animate-pulse" />
          <div className="h-8 w-48 bg-stone-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="h-48 bg-stone-100 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-20 bg-stone-200 rounded animate-pulse" />
                <div className="h-5 w-3/4 bg-stone-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-stone-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
