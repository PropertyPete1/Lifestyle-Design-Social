interface VideoListItemProps {
  title: string;
  type: "user" | "cartoon";
  status: "posted" | "scheduled" | "pending";
}

export default function VideoListItem({ title, type, status }: VideoListItemProps) {
  return (
    <div className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg flex justify-between items-center border border-gray-700">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-gray-400">{type === "cartoon" ? "Cartoon" : "Home Tour"} • {status}</p>
      </div>
      {status === "posted" && <span className="text-green-400">✅</span>}
      {status === "scheduled" && <span className="text-yellow-400">🕒</span>}
      {status === "pending" && <span className="text-gray-400">⌛</span>}
    </div>
  );
} 