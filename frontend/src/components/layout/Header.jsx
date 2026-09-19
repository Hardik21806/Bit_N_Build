import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Bell, User, LogOut, Sun, Moon, RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useWebSocketStore } from '../../store/uiStore';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '../ui';

const pageTitles = {
  '/': 'Dashboard',
  '/incidents': 'Active Incidents',
  '/incidents/report': 'Report Incident',
  '/resources': 'Resources',
  '/assignments': 'Assignments',
  '/map': 'Map View',
  '/analytics': 'Analytics',
  '/alerts': 'Alerts',
  '/settings': 'Settings',
};

export function Header() {
  const location = useLocation();
  const { connected, connecting } = useWebSocketStore();
  const [notifications, setNotifications] = React.useState([
    { id: '1', type: 'critical_incident', message: 'Critical flood incident reported in Sector 7', time: '2 min ago', read: false },
    { id: '2', type: 'escalation', message: 'Incident INC-2024-001 escalated - SLA breach', time: '15 min ago', read: false },
    { id: '3', type: 'resource_shortage', message: 'No ambulances available for Sector 3', time: '1 hour ago', read: true },
  ]);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const getPageTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (location.pathname === path || (path !== '/' && location.pathname.startsWith(path))) {
        return title;
      }
    }
    return 'EmergencyOps';
  };
  
  return (
    <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-text-primary lg:text-xl hidden sm:block">
            {getPageTitle()}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              'flex h-2 w-2 rounded-full',
              connected ? 'bg-severity-low' : connecting ? 'bg-severity-medium animate-pulse' : 'bg-severity-critical'
            )} />
            <span className="text-xs text-text-muted hidden md:block">
              {connected ? 'Live' : connecting ? 'Connecting...' : 'Offline'}
            </span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-lg text-text-muted hover:bg-background-tertiary hover:text-text-primary transition-colors" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-severity-critical text-xs font-medium text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="font-medium">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <DropdownMenuItem className="text-text-muted py-2">No notifications</DropdownMenuItem>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem key={n.id} className={cn('py-2', !n.read && 'font-medium')}>
                    <div className="flex items-start gap-2">
                      <div className={cn('mt-0.5 flex h-2 w-2 rounded-full', 
                        n.type === 'critical_incident' && 'bg-severity-critical',
                        n.type === 'escalation' && 'bg-severity-high',
                        n.type === 'resource_shortage' && 'bg-severity-medium'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{n.message}</p>
                        <p className="text-xs text-text-muted">{n.time}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-primary">View all notifications</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-background-tertiary transition-colors" aria-label="User menu">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium text-sm">
                  OP
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-medium">Operator</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Preferences</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => console.log('logout')}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}