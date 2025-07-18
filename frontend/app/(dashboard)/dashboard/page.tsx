'use client';
import ProtectedRoute from './ProtectedRoute';

export default function DashboardHome() {
  return (
    <ProtectedRoute>
      <div>
        <h2 className="text-xl font-semibold">Welcome back 👋</h2>
        <p className="text-gray-400 mt-2">This is your social media automation control panel.</p>
      </div>
    </ProtectedRoute>
  );
} 