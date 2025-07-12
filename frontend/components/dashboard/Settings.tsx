'use client';

import { Cog6ToothIcon, UserIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700">
          <UserIcon className="h-5 w-5" />
          <span>Edit Profile</span>
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-8">
        <div className="text-center">
          <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Settings</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings, API keys, and posting preferences.
          </p>
        </div>
      </div>
    </div>
  );
} 