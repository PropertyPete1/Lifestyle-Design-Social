'use client';

import React, { createContext, useContext, useState } from 'react';

type Post = { id: number; title: string };
type CalendarContextType = {
  assignments: Record<number, Post[]>;
  assignPost: (dayIndex: number, post: Post) => void;
};

const CalendarContext = createContext<CalendarContextType | null>(null);

export const useCalendar = () => {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('CalendarContext not found');
  return ctx;
};

export const CalendarProvider = ({ children }: { children: React.ReactNode }) => {
  const [assignments, setAssignments] = useState<Record<number, Post[]>>({});

  const assignPost = (dayIndex: number, post: Post) => {
    setAssignments((prev) => {
      const updated = { ...prev };
      if (!updated[dayIndex]) updated[dayIndex] = [];
      updated[dayIndex] = [...updated[dayIndex], post];
      return updated;
    });
  };

  return (
    <CalendarContext.Provider value={{ assignments, assignPost }}>
      {children}
    </CalendarContext.Provider>
  );
}; 