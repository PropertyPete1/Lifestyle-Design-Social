import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex flex-col flex-1">
        <Topbar />
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-950 text-white">
          {children}
        </div>
      </main>
    </div>
  );
} 