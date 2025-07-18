import React from 'react';

type Platform = 'Instagram' | 'YouTube' | 'TikTok';

type PlatformSelectorProps = {
  selectedPlatforms: Platform[];
  onTogglePlatform: (platform: Platform) => void;
};

export default function PlatformSelector({
  selectedPlatforms,
  onTogglePlatform,
}: PlatformSelectorProps) {
  const allPlatforms: Platform[] = ['Instagram', 'YouTube', 'TikTok'];

  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {allPlatforms.map((platform) => {
        const isSelected = selectedPlatforms.includes(platform);
        return (
          <button
            key={platform}
            onClick={() => onTogglePlatform(platform)}
            className={`px-4 py-2 text-sm rounded-md font-medium ${
              isSelected
                ? 'bg-green-600 text-white'
                : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
            }`}
          >
            {platform}
          </button>
        );
      })}
    </div>
  );
} 