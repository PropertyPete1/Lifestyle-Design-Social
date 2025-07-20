import { useDropzone } from "react-dropzone";

export default function FileDropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "video/mp4": [] },
    multiple: true,
    onDrop: onFiles,
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-400 p-6 rounded-md text-center"
    >
      <input {...getInputProps()} />
      <p>📂 Drag & drop your videos here, or click to browse</p>
    </div>
  );
} 