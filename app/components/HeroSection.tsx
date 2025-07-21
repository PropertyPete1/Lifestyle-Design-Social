'use client';

import { useState } from 'react';

export default function HeroSection() {
  const [text] = useState('🚀 Hello from Hero Section');

  return (
    <div className="text-3xl font-bold">{text}</div>
  );
} 