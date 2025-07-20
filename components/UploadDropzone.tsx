"use client";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface UploadDropzoneProps {
  onUpload: (files: File[]) => void;
}

export default function UploadDropzone({ onUpload }: UploadDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 30) {
      alert("Max 30 videos at once!");
      return;
    }
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'video/mp4': ['.mp4'] } });

  return (
    <div
      {...getRootProps()}
      className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all bg-gray-900 hover:bg-gray-800 text-white"
    >
      <input {...getInputProps()} />
      {isDragActive ? <p>Drop the videos here 📹</p> : <p>Drag & drop up to 30 videos or click to select</p>}
    </div>
  );
} 