'use client';

import { useSmartCaption } from '../../hooks/useSmartCaption';

export function SmartUploadEnhancer({ initialCaption }: { initialCaption: string }) {
  const { enhanced, enhance, loading } = useSmartCaption();

  return (
    <div className="mb-4">
      <button onClick={() => enhance(initialCaption)} className="bg-indigo-600 text-white px-4 py-2 rounded">
        {loading ? 'Enhancing...' : 'Auto-Enhance Caption'}
      </button>

      {enhanced && (
        <div className="mt-2 text-sm text-gray-200 border-t border-gray-700 pt-2">
          <strong>Smart Caption:</strong>
          <p>{enhanced}</p>
        </div>
      )}
    </div>
  );
} 