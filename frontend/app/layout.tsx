'use client';

import React from 'react';
import Navbar from '../components/Navbar';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <div className="min-h-screen bg-white">
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
