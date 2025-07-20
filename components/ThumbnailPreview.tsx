export default function ThumbnailPreview({ url }: { url: string }) {
  return (
    <div className="mt-4">
      <p className="text-white text-sm mb-2">Thumbnail Preview:</p>
      <img src={url} alt="thumbnail" className="rounded-lg w-full max-w-xs border border-gray-700" />
    </div>
  );
} 