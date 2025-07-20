export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-600 text-white px-4 py-2 rounded-md mt-4 text-sm">
      ⚠️ {message}
    </div>
  );
} 