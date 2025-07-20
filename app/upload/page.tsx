"use client";

import UploadDropzone from "@/components/UploadDropzone";
import VideoUploadCard from "@/components/VideoUploadCard";
import ThumbnailGeneratorButton from "@/components/ThumbnailGeneratorButton";
import { SmartUploadEnhancer } from '../../components/Upload/SmartUploadEnhancer';
import { useState } from "react";

export default function UploadPage() {
  const [uploads, setUploads] = useState<{ name: string; status: string }[]>([]);
  const sampleCaption = "Brand new listing just hit San Antonio 🏡🔥";

  const handleUpload = (files: File[]) => {
    const mapped = files.map((file) => ({
      name: file.name,
      status: "uploading",
    }));

    setUploads(mapped);

    // Simulate upload delay
    setTimeout(() => {
      setUploads((prev) =>
        prev.map((item) => ({ ...item, status: "queued" }))
      );
    }, 1500);
  };

  return (
    <main className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Upload Videos</h1>
      <SmartUploadEnhancer initialCaption={sampleCaption} />
      <UploadDropzone onUpload={handleUpload} />
      <div className="mt-6 space-y-4">
        {uploads.map((file, idx) => (
          <div key={idx} className="border rounded-lg p-4 bg-white shadow-sm">
            <VideoUploadCard name={file.name} status={file.status as any} />
            {file.status === "queued" && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Generate Thumbnail for {file.name}
                </h3>
                <ThumbnailGeneratorButton filename={file.name} />
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
} 