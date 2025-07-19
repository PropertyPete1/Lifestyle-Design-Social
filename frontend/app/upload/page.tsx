'use client';

import LayoutShell from '@/app/components/ui/LayoutShell';
import UploadForm from '@/app/components/upload/UploadForm';

export default function UploadPage() {
  return (
    <LayoutShell>
      <h1 className="text-2xl font-bold mb-4">Upload Videos</h1>
      <UploadForm />
    </LayoutShell>
  );
} 