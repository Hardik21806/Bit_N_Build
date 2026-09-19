import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSidebarStore } from '../../store/uiStore';

export function PageContainer({ children, className }) {
  return (
    <main className={cn('flex-1 p-4 lg:p-6 overflow-auto', className)}>
      {children}
    </main>
  );
}

export function Layout() {
  const { collapsed } = useSidebarStore();
  
  return (
    <div className="min-h-screen bg-background-secondary flex">
      <Sidebar />
      <div className={cn('flex flex-col flex-1 transition-all duration-300', collapsed ? 'ml-16 lg:ml-16' : 'ml-64 lg:ml-64')}>
        <Header />
        <PageContainer>
          <Outlet />
        </PageContainer>
      </div>
    </div>
  );
}