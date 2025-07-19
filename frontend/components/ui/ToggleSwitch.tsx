type Props = {
  enabled: boolean;
  onToggle: () => void;
};

export default function ToggleSwitch({ enabled, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`w-14 h-8 rounded-full p-1 flex items-center transition ${
        enabled ? "bg-green-500" : "bg-gray-600"
      }`}
    >
      <div
        className={`w-6 h-6 bg-white rounded-full shadow-md transform transition ${
          enabled ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
} 