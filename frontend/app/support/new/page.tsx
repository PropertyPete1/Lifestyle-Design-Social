'use client';

import { useState } from 'react';
import { createTicket } from '@/lib/tickets/createTicket';
import { useRouter } from 'next/navigation';

export default function NewSupportTicketPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await createTicket(title, description);
    setLoading(false);
    router.push('/tickets');
  }

  return (
    <main className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">New Support Ticket</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Ticket title"
          className="w-full p-2 bg-zinc-800 rounded"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Describe your issue"
          className="w-full p-2 h-32 bg-zinc-800 rounded"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-green-500 px-4 py-2 rounded font-semibold"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </main>
  );
} 