"use client";

export default function Home() {
  const message = "Welcome to Lifestyle Design Social ✨";

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <h1 className="text-3xl md:text-5xl font-bold text-center">
        {message}
      </h1>
    </main>
  );
} 