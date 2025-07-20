import { useState, useEffect, useCallback } from 'react';

interface ThumbnailOptions {
  autoGenerate?: boolean;
  checkLimits?: boolean;
  retries?: number;
  timeout?: number;
}

interface ThumbnailState {
  thumbnail: string | null;
  loading: boolean;
  error: string | null;
  progress: number;
}

export function useThumbnail(filename: string, options: ThumbnailOptions = {}) {
  const { autoGenerate = false, checkLimits = true, retries = 2, timeout = 10000 } = options;
  
  const [state, setState] = useState<ThumbnailState>({
    thumbnail: null,
    loading: false,
    error: null,
    progress: 0
  });

  const checkThumbnailLimits = useCallback(async () => {
    try {
      const response = await fetch('/api/videos/checkLimit');
      const data = await response.json();
      
      if (!data.canGenerate) {
        throw new Error(data.reason || 'Thumbnail generation limit reached');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to check thumbnail limits:', error);
      return false;
    }
  }, []);

  const generate = useCallback(async () => {
    if (!filename) return;

    setState(prev => ({ ...prev, loading: true, error: null, progress: 0 }));

    try {
      // Check limits if enabled
      if (checkLimits) {
        const canGenerate = await checkThumbnailLimits();
        if (!canGenerate) {
          throw new Error('Thumbnail generation limit reached');
        }
      }

      // Try to generate thumbnail with retries
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const response = await fetch('/api/videos/thumbnail', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          if (data.success && data.thumbnail) {
            setState(prev => ({
              ...prev,
              thumbnail: data.thumbnail,
              loading: false,
              progress: 100
            }));
            return data.thumbnail;
          } else {
            throw new Error(data.error || 'Thumbnail generation failed');
          }
        } catch (error) {
          console.error(`Thumbnail attempt ${attempt + 1} failed:`, error);
          
          if (attempt === retries) {
            throw error;
          }
          
          // Update progress for retry
          setState(prev => ({
            ...prev,
            progress: ((attempt + 1) / (retries + 1)) * 100
          }));
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        progress: 0
      }));
    }
  }, [filename, checkLimits, retries, timeout, checkThumbnailLimits]);

  const checkExisting = useCallback(async () => {
    if (!filename) return null;

    try {
      const thumbnailUrl = `/thumbnails/${filename}.jpg`;
      const response = await fetch(thumbnailUrl, { method: 'HEAD' });
      
      if (response.ok) {
        setState(prev => ({ ...prev, thumbnail: thumbnailUrl }));
        return thumbnailUrl;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }, [filename]);

  const reset = useCallback(() => {
    setState({
      thumbnail: null,
      loading: false,
      error: null,
      progress: 0
    });
  }, []);

  // Auto-generate on mount if enabled
  useEffect(() => {
    if (autoGenerate && filename) {
      // First check if thumbnail already exists
      checkExisting().then(existingThumbnail => {
        if (!existingThumbnail) {
          generate();
        }
      });
    }
  }, [filename, autoGenerate, generate, checkExisting]);

  return {
    ...state,
    generate,
    checkExisting,
    reset,
    canGenerate: !state.error || !state.error.includes('limit')
  };
}

// Simplified version for basic usage
export function useSimpleThumbnail(filename: string) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!filename) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/videos/thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      const data = await response.json();

      if (data.success && data.thumbnail) {
        setThumbnail(data.thumbnail);
      } else {
        setError(data.error || 'Failed to generate thumbnail');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Thumbnail generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { thumbnail, loading, error, generate };
} 