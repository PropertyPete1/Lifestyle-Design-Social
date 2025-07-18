export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex text-white bg-black">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111] p-6 border-r border-gray-800 hidden md:flex flex-col gap-4">
        <h2 className="text-xl font-bold text-brand">LDS Admin</h2>
        <nav className="flex flex-col gap-2 mt-6">
          <a href="/dashboard" className="hover:text-brand">📊 Dashboard</a>
          <a href="/dashboard/upload" className="hover:text-brand">📤 Upload</a>
          <a href="/dashboard/captions" className="hover:text-brand">✍️ Captions</a>
          <a href="/dashboard/cartoons" className="hover:text-brand">🎨 Cartoons</a>
          <a href="/cartoon" className="hover:underline">🎨 Cartoon Generator</a>
          <a href="/dashboard/analytics" className="hover:text-brand">📈 Analytics</a>
          <a
            href="/analytics"
            className="text-sm text-blue-400 hover:underline"
          >
            Analytics
          </a>
          <a href="/login" className="hover:text-red-500 mt-4">🚪 Logout</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <header className="border-b border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </header>
        {children}
      </main>
    </div>
  );
} 