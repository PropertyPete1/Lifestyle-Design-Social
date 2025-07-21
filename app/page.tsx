'use client';

import HeroSection from './components/HeroSection';
// import Dashboard from './components/Dashboard'; // Add later once confirmed stable

export default function HomePage() {
  return (
    <div className="p-10 bg-black text-white">
      <HeroSection />
      {/* <Dashboard /> */}
    </div>
  );
} 