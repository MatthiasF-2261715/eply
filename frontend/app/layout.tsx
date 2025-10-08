'use client';

import React from 'react';
import Navbar from '../components/Navbar';
import './globals.css';
import { ToastContainer } from "@/components/ui/toast-container"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <div className="min-h-screen bg-white">
          <Navbar />
          <main>{children}</main>
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}
