"use client";

import GenerateCartoonForm from '@/components/GenerateCartoonForm';

export default function CartoonPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-4">Cartoon Generator</h1>
      <GenerateCartoonForm />
    </div>
  );
} 