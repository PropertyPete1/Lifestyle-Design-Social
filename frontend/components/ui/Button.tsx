import React from 'react';

type ButtonProps = {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export default function Button({ children, onClick, className = '', type = 'button' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      type={type}
      className={`bg-black text-white py-2 px-4 rounded-md hover:bg-gray-900 transition ${className}`}
    >
      {children}
    </button>
  )
} 