'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import { MessagingProvider } from '@/contexts/MessagingContext';

export default function MessagingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <MessagingProvider>
        <main className="flex-1 container mx-auto p-4">{children}</main>
      </MessagingProvider>
    </div>
  );
}
