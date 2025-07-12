'use client';

import { ChartBarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700">
          <ArrowTrendingUpIcon className="h-5 w-5" />
          <span>Generate Report</span>
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-8">
        <div className="text-center">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Analytics Dashboard</h3>
          <p className="mt-1 text-sm text-gray-500">
            View detailed analytics and insights for your social media performance.
          </p>
        </div>
      </div>
    </div>
  );
} 