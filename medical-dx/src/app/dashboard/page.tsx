export default function Dashboard() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b">
        <h1 className="text-xl font-semibold">Medical Diagnosis Cases</h1>
        <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-zinc-100 rounded">Sign Out</button>
      </header>
      <main className="max-w-4xl mx-auto py-8 px-6">
        <p className="text-zinc-600">Check back later!</p>
      </main>
    </div>
  );
}