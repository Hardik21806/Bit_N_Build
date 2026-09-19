import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  AlertTriangle,
  List,
  PlusCircle,
  Truck,
  BarChart2,
  Bell,
  Settings,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useSidebarStore } from '../../store/uiStore';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Active Incidents', href: '/incidents', icon: AlertTriangle },
  { name: 'Report Incident', href: '/incidents/report', icon: PlusCircle },
  { name: 'Resources', href: '/resources', icon: Truck },
  { name: 'Assignments', href: '/assignments', icon: Users },
  { name: 'Map View', href: '/map', icon: MapPin },
  { name: 'Analytics', href: '/analytics', icon: BarChart2 },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { collapsed, toggleCollapsed } = useSidebarStore();
  
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-background border-r border-border transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
      aria-label="Main navigation"
    >
      <div className={cn('flex h-16 items-center justify-between px-4 border-b border-border', collapsed && 'justify-center')}>
        {!collapsed && (
          <span className="text-lg font-bold text-text-primary">EmergencyOps</span>
        )}
        <button
          onClick={toggleCollapsed}
          className={cn(
            'p-2 rounded-md text-text-muted hover:bg-background-tertiary hover:text-text-primary transition-colors',
            collapsed && 'mx-auto'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Navigation">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive: active }) => cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                active
                  ? 'bg-primary-light text-primary'
                  : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary',
                collapsed && 'justify-center'
              )}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} aria-hidden="true" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>
      
      <div className={cn('p-3 border-t border-border', collapsed && 'hidden')}>
        <div className="rounded-lg bg-background-tertiary p-3">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Quick Actions</p>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-background hover:text-text-primary transition-colors">
              <PlusCircle className="h-4 w-4" />
              <span>New Incident</span>
            </button>
            <button className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-background hover:text-text-primary transition-colors">
              <Truck className="h-4 w-4" />
              <span>Dispatch Resource</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}