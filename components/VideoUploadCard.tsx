interface Props {
  name: string;
  status: "uploading" | "queued" | "error";
}

export default function VideoUploadCard({ name, status }: Props) {
  const statusIcon = status === "uploading" ? "⬆️" : status === "queued" ? "✅" : "❌";

  return (
    <div className="flex justify-between items-center bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-800">
      <span>{name}</span>
      <span>{statusIcon}</span>
    </div>
  );
} 