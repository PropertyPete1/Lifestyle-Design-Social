import { useEffect, useState } from 'react';

interface CartoonJob {
  id: string;
  prompt: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  estimatedTime?: string;
  createdAt: string;
}

interface QueueData {
  status: string;
  items: CartoonJob[];
  totalJobs: number;
  processingJobs: number;
  queuedJobs: number;
  completedJobs: number;
}

export function useCartoonQueue() {
  const [queue, setQueue] = useState<CartoonJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueStats, setQueueStats] = useState<Omit<QueueData, 'items'> | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/cartoon/queue');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: QueueData = await response.json();
      
      setQueue(data.items || []);
      setQueueStats({
        status: data.status,
        totalJobs: data.totalJobs,
        processingJobs: data.processingJobs,
        queuedJobs: data.queuedJobs,
        completedJobs: data.completedJobs
      });
    } catch (err) {
      console.error('Failed to fetch cartoon queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const refreshQueue = () => {
    fetchQueue();
  };

  return {
    queue,
    loading,
    error,
    queueStats,
    refreshQueue
  };
} 