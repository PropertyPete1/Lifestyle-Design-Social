import { useState } from "react";

export function useVideoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadVideo = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/video/upload", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    setIsUploading(false);
    return result;
  };

  return { uploadVideo, isUploading, uploadProgress };
} 