'use client';

import { 
  VideoCameraIcon, 
  CalendarDaysIcon, 
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { DashboardStats } from '@/lib/types';
import LoadingSpinner from '../ui/LoadingSpinner';
import { formatNumber, formatRelativeTime } from '@/lib/utils';

interface DashboardOverviewProps {
  stats?: DashboardStats;
  loading: boolean;
}

export default function DashboardOverview({ stats, loading }: DashboardOverviewProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Posts',
      value: stats?.totalPosts || 0,
      icon: CalendarDaysIcon,
      change: '+12%',
      changeType: 'increase' as const,
      color: 'bg-blue-500',
    },
    {
      name: 'Published Posts',
      value: stats?.publishedPosts || 0,
      icon: ChartBarIcon,
      change: '+5%',
      changeType: 'increase' as const,
      color: 'bg-green-500',
    },
    {
      name: 'Total Views',
      value: formatNumber(stats?.totalEngagement?.views || 0),
      icon: EyeIcon,
      change: '+23%',
      changeType: 'increase' as const,
      color: 'bg-purple-500',
    },
    {
      name: 'Success Rate',
      value: `${stats?.successRate || 0}%`,
      icon: HeartIcon,
      change: '+2.1%',
      changeType: 'increase' as const,
      color: 'bg-pink-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
        <p className="text-blue-100">
          Here's what's happening with your real estate content today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} p-3 rounded-md`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.changeType === 'increase' ? (
                          <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                        ) : (
                          <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {stat.changeType === 'increase' ? 'Increased' : 'Decreased'} by
                        </span>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Engagement Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Engagement Overview</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">👍</div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Likes</h4>
              <p className="text-lg font-semibold text-gray-900">
                {formatNumber(stats?.totalEngagement?.likes || 0)}
              </p>
              <p className="text-sm text-gray-500">
                Avg: {stats?.averageEngagement?.likes || 0}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">💬</div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Comments</h4>
              <p className="text-lg font-semibold text-gray-900">
                {formatNumber(stats?.totalEngagement?.comments || 0)}
              </p>
              <p className="text-sm text-gray-500">
                Avg: {stats?.averageEngagement?.comments || 0}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📤</div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Shares</h4>
              <p className="text-lg font-semibold text-gray-900">
                {formatNumber(stats?.totalEngagement?.shares || 0)}
              </p>
              <p className="text-sm text-gray-500">
                Avg: {stats?.averageEngagement?.shares || 0}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">👁️</div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Views</h4>
              <p className="text-lg font-semibold text-gray-900">
                {formatNumber(stats?.totalEngagement?.views || 0)}
              </p>
              <p className="text-sm text-gray-500">
                Avg: {stats?.averageEngagement?.views || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Getting Started</h3>
        </div>
        <div className="px-6 py-4">
          <div className="text-center py-8">
            <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Welcome to Real Estate Auto-Posting!</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start by uploading videos and scheduling posts to see your analytics here.
            </p>
            <div className="mt-6">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Upload Your First Video
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 