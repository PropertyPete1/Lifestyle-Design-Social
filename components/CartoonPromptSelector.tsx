const cartoonOptions = [
  "🏡 Relatable Realtor Problems",
  "😂 Funny Client Reactions",
  "🤔 Wild Real Estate Facts",
  "🎯 First-Time Buyer Tips",
];

export default function CartoonPromptSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <select
      className="p-2 border rounded"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select cartoon style</option>
      {cartoonOptions.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
} 