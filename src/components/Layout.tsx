"use client";

import React from 'react';
import Header from './Header';
import { MadeWithDyad } from './made-with-dyad';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Layout;