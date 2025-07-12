'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  HomeIcon, 
  VideoCameraIcon, 
  CalendarDaysIcon, 
  ChartBarIcon,
  Cog6ToothIcon,
  PlusIcon,
  BellIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { NavItem } from '@/lib/types';
import LoadingSpinner from './ui/LoadingSpinner';
import DashboardOverview from './dashboard/DashboardOverview';
import VideoLibrary from './dashboard/VideoLibrary';
import PostScheduler from './dashboard/PostScheduler';
import Analytics from './dashboard/Analytics';
import Settings from './dashboard/Settings';

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '#dashboard', icon: HomeIcon, current: true },
  { name: 'Video Library', href: '#videos', icon: VideoCameraIcon },
  { name: 'Schedule Posts', href: '#schedule', icon: CalendarDaysIcon },
  { name: 'Analytics', href: '#analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '#settings', icon: Cog6ToothIcon },
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, logout } = useAuth();

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.analytics.getDashboardStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    
    // Update navigation current state
    navigation.forEach(item => {
      item.current = item.href === `#${tab}`;
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview stats={dashboardStats} loading={statsLoading} />;
      case 'videos':
        return <VideoLibrary />;
      case 'schedule':
        return <PostScheduler />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardOverview stats={dashboardStats} loading={statsLoading} />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent 
            navigation={navigation} 
            onTabChange={handleTabChange}
            activeTab={activeTab}
          />
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent 
            navigation={navigation} 
            onTabChange={handleTabChange}
            activeTab={activeTab}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <h1 className="text-2xl font-semibold text-gray-900 ml-2">
                      {navigation.find(item => item.href === `#${activeTab}`)?.name || 'Dashboard'}
                    </h1>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              <button
                type="button"
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <BellIcon className="h-6 w-6" />
              </button>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <button
                    type="button"
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={logout}
                  >
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                    <span className="ml-2 text-gray-700 font-medium">{user?.name}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Sidebar content component
function SidebarContent({ 
  navigation, 
  onTabChange, 
  activeTab 
}: { 
  navigation: NavItem[];
  onTabChange: (tab: string) => void;
  activeTab: string;
}) {
  return (
    <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-bold text-gray-900">
            🏠 Real Estate Auto-Post
          </h1>
        </div>
        
        <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
          {navigation.map((item) => {
            const isActive = activeTab === item.href.substring(1);
            return (
              <button
                key={item.name}
                onClick={() => onTabChange(item.href.substring(1))}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
                {item.badge && (
                  <span className="ml-auto bg-red-100 text-red-600 text-xs rounded-full px-2 py-1">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">
                Real Estate Auto-Posting SaaS v1.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 