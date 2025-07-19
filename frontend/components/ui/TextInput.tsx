type Props = {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
};

export default function TextInput({ label, value, onChange, placeholder }: Props) {
  return (
    <div className="mb-4">
      <label className="block text-white font-medium mb-1">{label}</label>
      <input
        className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
} 