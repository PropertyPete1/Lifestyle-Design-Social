import { LogoutButton } from './LogoutButton'

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4 bg-black text-white border-b border-gray-700">
      <h1 className="text-xl font-bold">Lifestyle Design Social</h1>
      <LogoutButton />
    </header>
  )
} 