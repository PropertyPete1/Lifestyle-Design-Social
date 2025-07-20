'use client';

import { useState, useEffect } from 'react';

interface CartoonJob {
  id: string;
  prompt: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  estimatedTime?: string;
  createdAt: string;
}

export default function CartoonQueueStatus() {
  const [jobs, setJobs] = useState<CartoonJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading cartoon jobs
    const loadJobs = async () => {
      try {
        setLoading(true);
        // Mock data for now - replace with actual API call
        const mockJobs: CartoonJob[] = [
          {
            id: 'cartoon_1',
            prompt: 'Create a cartoon showing a beautiful house',
            status: 'processing',
            progress: 65,
            estimatedTime: '2-3 minutes',
            createdAt: new Date().toISOString()
          },
          {
            id: 'cartoon_2',
            prompt: 'Design a cartoon of happy families',
            status: 'queued',
            createdAt: new Date(Date.now() - 300000).toISOString()
          }
        ];
        
        setJobs(mockJobs);
      } catch (error) {
        console.error('Failed to load cartoon jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(loadJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: CartoonJob['status']) => {
    switch (status) {
      case 'queued': return 'text-yellow-400';
      case 'processing': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: CartoonJob['status']) => {
    switch (status) {
      case 'queued': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="mt-6 p-4 bg-zinc-800 text-white rounded-lg border border-zinc-700">
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-700 rounded mb-2"></div>
          <div className="h-3 bg-zinc-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="mt-6 p-4 bg-zinc-800 text-gray-400 rounded-lg border border-zinc-700">
        <p className="text-center">🎬 No cartoon jobs in queue</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-lg font-semibold text-white">Cartoon Generation Queue</h3>
      
      {jobs.map((job) => (
        <div key={job.id} className="p-4 bg-zinc-800 text-white rounded-lg border border-zinc-700">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getStatusIcon(job.status)}</span>
              <span className={`font-medium ${getStatusColor(job.status)}`}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {new Date(job.createdAt).toLocaleTimeString()}
            </span>
          </div>
          
          <p className="text-sm text-gray-300 mb-3">{job.prompt}</p>
          
          {job.status === 'processing' && job.progress !== undefined && (
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{job.progress}%</span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {job.estimatedTime && (
            <p className="text-xs text-gray-400">
              Estimated time: {job.estimatedTime}
            </p>
          )}
        </div>
      ))}
      
      <div className="text-xs text-gray-500 text-center">
        Updates every 30 seconds
      </div>
    </div>
  );
} 