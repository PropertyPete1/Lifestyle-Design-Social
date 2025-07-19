'use client';

import { useEffect, useState } from 'react';

interface Ticket {
  id: string;
  title: string;
  createdAt: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    // Placeholder mock, replace with real API call
    setTickets([
      { id: '1', title: 'Instagram Token Refresh Bug', createdAt: '2025-07-01' },
      { id: '2', title: 'YouTube Caption Not Matching', createdAt: '2025-07-04' },
    ]);
  }, []);

  return (
    <main className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Support Tickets</h1>
      <ul>
        {tickets.map(ticket => (
          <li key={ticket.id} className="mb-2">
            <div className="font-medium">{ticket.title}</div>
            <div className="text-sm text-gray-400">Opened: {ticket.createdAt}</div>
          </li>
        ))}
      </ul>
    </main>
  );
} 