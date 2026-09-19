import * as React from 'react';
import { cn } from '../../lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSidebarStore } from '../../store/uiStore';

export function PageContainer({ children, className }) {
  return (
    <main
      className={cn(
        // Main page area
        'flex-1 min-w-0',

        // Warm application canvas
        'bg-[#f6f6f3]',

        // Scrolling
        'overflow-x-auto',
        'overflow-y-auto',

        // Spacing
        'p-4',
        'lg:p-6',

        // Prevent content from forcing the entire layout wider
        '[&>*]:min-w-0',

        className
      )}
    >
      {children}
    </main>
  );
}

export function Layout({ children }) {
  const { collapsed } = useSidebarStore();

  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#f6f6f3] flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Application shell */}
      <div
        className={cn(
          'flex min-h-screen min-w-0 flex-1 flex-col',
          'transition-[margin] duration-200 ease-out',
          collapsed
            ? 'ml-16 lg:ml-16'
            : 'ml-64 lg:ml-64'
        )}
      >
        {/* Header */}
        <Header />

        {/* Page content */}
        <PageContainer>
          {children}
        </PageContainer>
      </div>
    </div>
  );
}