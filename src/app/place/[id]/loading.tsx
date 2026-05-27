export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="h-5 w-48 bg-stone-200 rounded animate-pulse" />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 lg:mb-8 h-64 sm:h-[400px] lg:h-[460px] bg-stone-200 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[200, 140, 220].map((h, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8"
              >
                <div className="h-6 w-32 bg-stone-200 rounded mb-4 animate-pulse" />
                <div
                  className="bg-stone-100 rounded animate-pulse"
                  style={{ height: `${h}px` }}
                />
              </div>
            ))}
          </div>
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
              <div className="h-6 w-40 bg-stone-200 rounded animate-pulse" />
              <div className="h-24 bg-stone-100 rounded-xl animate-pulse" />
              <div className="h-32 bg-stone-100 rounded-xl animate-pulse" />
              <div className="h-12 bg-stone-200 rounded-xl animate-pulse" />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
