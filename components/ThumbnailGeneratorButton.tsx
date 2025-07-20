import { useState } from 'react';

type Props = {
  filename: string;
};

export default function ThumbnailGeneratorButton({ filename }: Props) {
  const [thumbnail, setThumbnail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/videos/thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });
      
      const data = await res.json();
      
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

  return (
    <div className="space-y-3">
      <button 
        onClick={handleClick} 
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center space-x-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Generating...</span>
          </span>
        ) : (
          'Generate Thumbnail'
        )}
      </button>
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      {thumbnail && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Thumbnail Preview:</h4>
          <img 
            src={thumbnail} 
            alt="Video thumbnail" 
            className="w-48 h-36 object-cover rounded-lg border border-gray-200 shadow-sm"
          />
          <div className="flex space-x-2">
            <button
              onClick={() => window.open(thumbnail, '_blank')}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              View Full Size
            </button>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = thumbnail;
                link.download = `${filename}.jpg`;
                link.click();
              }}
              className="text-xs text-green-600 hover:text-green-800 underline"
            >
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 