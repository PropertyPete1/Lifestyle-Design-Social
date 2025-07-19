'use client';
import ProtectedPage from '@/components/ProtectedPage'
import Header from '@/components/Header'

export default function DashboardHome() {
  return (
    <ProtectedPage>
      <Header />
      <main className="p-4">
        <h2 className="text-xl font-semibold mb-2">Welcome to Your Dashboard</h2>
        <p>Use the menu to upload or view videos.</p>
      </main>
    </ProtectedPage>
  )
} 