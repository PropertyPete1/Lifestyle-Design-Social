import React from 'react';
import { ArrowUpOnSquareIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function VideoUploadButton() {
  return (
    <Link
      href="/upload"
      className="inline-flex gap-2 items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    >
      <ArrowUpOnSquareIcon className="h-4 w-4" />
      Upload Video
    </Link>
  );
} 