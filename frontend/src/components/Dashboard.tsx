'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  HomeIcon, 
  VideoCameraIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  CogIcon,
  PlayIcon,
  PlusIcon,
  BellIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface DashboardProps {
  children?: React.ReactNode
}

const Dashboard: React.FC<DashboardProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, id: 'dashboard' },
    { name: 'Videos', href: '/videos', icon: VideoCameraIcon, id: 'videos' },
    { name: 'Posts', href: '/posts', icon: DocumentTextIcon, id: 'posts' },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, id: 'analytics' },
    { name: 'Auto Post', href: '/auto-post', icon: PlayIcon, id: 'auto-post' },
    { name: 'Cartoons', href: '/cartoons', icon: PlusIcon, id: 'cartoons' },
    { name: 'Settings', href: '/settings', icon: CogIcon, id: 'settings' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-gray-900">Auto Posting</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`${
                      currentPage === item.id
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium border-l-4 transition-colors duration-150 ease-in-out`}
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(item.id)
                      window.history.pushState({}, '', item.href)
                    }}
                  >
                    <Icon
                      className={`${
                        currentPage === item.id ? 'text-indigo-500' : 'text-gray-400'
                      } mr-3 h-6 w-6`}
                    />
                    {item.name}
                  </a>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.email}</p>
                <button
                  onClick={logout}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <span className="sr-only">Open sidebar</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children || (
                <div className="py-4">
                  <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Welcome to Auto Posting</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by selecting a page from the sidebar.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard 