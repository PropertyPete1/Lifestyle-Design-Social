type Props = {
  label: string
  type?: string
  value: string
  onChange: (val: string) => void
}

export default function TextInput({ label, value, onChange, type = 'text' }: Props) {
  return (
    <div className="mb-4">
      <label className="block text-sm mb-1 text-white">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none"
      />
    </div>
  )
} 