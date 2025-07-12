'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Dashboard from '@/components/Dashboard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const CartoonsContent = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cartoon Gallery</h1>
        <p className="text-gray-600">Browse and manage your real estate cartoon videos</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((cartoon) => (
          <div key={cartoon} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900">Real Estate Cartoon {cartoon}</h3>
              <p className="text-sm text-gray-500 mt-1">Modern kitchen showcase</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Ready
                </span>
                <div className="flex space-x-2">
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Preview
                  </button>
                  <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                    Use
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Cartoon</h3>
        <p className="text-gray-600 mb-4">Generate a new cartoon video from your uploaded content</p>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
          Generate Cartoon
        </button>
      </div>
    </div>
  )
}

export default function CartoonsPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access cartoons.</p>
        </div>
      </div>
    )
  }

  return (
    <Dashboard>
      <CartoonsContent />
    </Dashboard>
  )
} 