type Props = {
  status: "uploading" | "done" | "error";
};

export default function UploadStatus({ status }: Props) {
  const message =
    status === "uploading"
      ? "Uploading..."
      : status === "done"
      ? "Upload complete ✅"
      : "Upload failed ❌";

  return (
    <div className="text-sm text-center py-4 text-white">
      {message}
    </div>
  );
} 