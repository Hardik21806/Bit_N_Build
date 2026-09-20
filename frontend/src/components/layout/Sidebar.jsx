import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  AlertTriangle,
  PlusCircle,
  Truck,
  BarChart2,
  Bell,
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
];

const primaryActions = [
  {
    name: 'New Incident',
    href: '/incidents/report',
    icon: PlusCircle,
  },
  {
    name: 'Dispatch Resource',
    href: '/assignments',
    icon: Truck,
  },
];

export function Sidebar() {
  const location = useLocation();
  const { collapsed, toggleCollapsed } = useSidebarStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col',
        'bg-[#f7f6f2] border-r border-[#dfddd7]',
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
      aria-label="Main navigation"
    >

      {/* =====================================================
          BRAND HEADER
      ===================================================== */}

      <div
        className={cn(
          'relative flex h-[72px] shrink-0 items-center',
          'border-b border-[#dfddd7]',
          collapsed
            ? 'justify-center px-2'
            : 'justify-between px-4'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-3">

            {/* Brand mark */}
            <div
              className="
                relative flex h-9 w-9 shrink-0
                items-center justify-center
                rounded-[10px]
                bg-[#183b63]
                text-white
                shadow-[0_2px_5px_rgba(24,59,99,0.18)]
              "
            >
              <span
                className="
                  font-display
                  text-[15px]
                  font-bold
                  tracking-[-0.04em]
                "
              >
                EO
              </span>

              {/* small emergency accent */}
              <span
                className="
                  absolute
                  -right-0.5
                  -top-0.5
                  h-2
                  w-2
                  rounded-full
                  bg-[#d97706]
                  ring-2
                  ring-[#f7f6f2]
                "
              />
            </div>

            {/* Brand name */}
            <div className="leading-none">
              <div
                className="
                  font-display
                  text-[19px]
                  font-bold
                  tracking-[-0.045em]
                  text-[#201e1b]
                "
              >
                EmergencyOps
              </div>

              <div
                className="
                  mt-1
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.16em]
                  text-[#89847b]
                "
              >
                Response Command
              </div>
            </div>
          </div>
        )}

        {collapsed && (
          <div
            className="
              relative flex h-9 w-9
              items-center justify-center
              rounded-[10px]
              bg-[#183b63]
              text-white
            "
          >
            <span
              className="
                font-display
                text-[14px]
                font-bold
                tracking-[-0.04em]
              "
            >
              EO
            </span>

            <span
              className="
                absolute
                -right-0.5
                -top-0.5
                h-2
                w-2
                rounded-full
                bg-[#d97706]
                ring-2
                ring-[#f7f6f2]
              "
            />
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            `
              flex h-7 w-7 shrink-0 items-center justify-center
              rounded-md
              text-[#817c74]
              transition-all duration-150
              hover:bg-[#ebe9e3]
              hover:text-[#201e1b]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#2457a6]
            `,
            collapsed && 'absolute right-2 top-3'
          )}
          aria-label={
            collapsed
              ? 'Expand sidebar'
              : 'Collapse sidebar'
          }
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <ChevronRight className="h-[17px] w-[17px]" />
          ) : (
            <ChevronLeft className="h-[17px] w-[17px]" />
          )}
        </button>
      </div>


      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav
        className="
          flex-1
          overflow-y-auto
          px-3
          py-5
          scrollbar-thin
        "
        aria-label="Navigation"
      >

        {!collapsed && (
          <div
            className="
              mb-2
              px-3
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.17em]
              text-[#969188]
            "
          >
            Operations
          </div>
        )}

        <div className="space-y-1">

          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (
                item.href !== '/' &&
                location.pathname.startsWith(item.href)
              );

            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  `
                    group
                    relative
                    flex
                    h-11
                    items-center
                    gap-3
                    rounded-[9px]
                    px-3
                    text-[14px]
                    font-medium
                    transition-all
                    duration-150
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[#2457a6]
                    focus-visible:ring-offset-1
                  `,

                  isActive
                    ? `
                      bg-[#eaf1fb]
                      text-[#1f5598]
                    `
                    : `
                      text-[#5e5a54]
                      hover:bg-[#eeece7]
                      hover:text-[#292724]
                    `,

                  collapsed &&
                    'justify-center px-0'
                )}
                aria-current={
                  isActive ? 'page' : undefined
                }
                title={
                  collapsed
                    ? item.name
                    : undefined
                }
              >

                {/* Active indicator */}
                {isActive && (
                  <span
                    className="
                      absolute
                      left-0
                      top-2.5
                      h-6
                      w-[3px]
                      rounded-r-full
                      bg-[#2457a6]
                    "
                  />
                )}

                <Icon
                  className={cn(
                    'h-[19px] w-[19px] shrink-0 transition-colors',

                    isActive
                      ? 'text-[#2457a6]'
                      : 'text-[#706b64] group-hover:text-[#3d3934]'
                  )}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                {!collapsed && (
                  <span className="truncate">
                    {item.name}
                  </span>
                )}

                {/* Special incident marker */}
                {!collapsed &&
                  item.name === 'Active Incidents' && (
                    <span
                      className={cn(
                        `
                          ml-auto
                          h-1.5
                          w-1.5
                          rounded-full
                        `,
                        isActive
                          ? 'bg-[#c2410c]'
                          : 'bg-[#b8b3aa]'
                      )}
                    />
                  )}
              </NavLink>
            );
          })}

        </div>
      </nav>


      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      {!collapsed && (
        <div
          className="
            shrink-0
            border-t
            border-[#dfddd7]
            bg-[#f3f1ec]
            px-3
            py-4
          "
        >

          <div
            className="
              mb-2.5
              px-3
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.17em]
              text-[#89847b]
            "
          >
            Quick Actions
          </div>

          <div className="space-y-1">

            {primaryActions.map((item) => {
              const isActive =
                location.pathname === item.href;

              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    `
                      group
                      flex
                      h-10
                      items-center
                      gap-3
                      rounded-[8px]
                      border
                      px-3
                      text-[13px]
                      font-medium
                      transition-all
                      duration-150
                    `,

                    isActive
                      ? `
                        border-[#c9d8eb]
                        bg-[#eaf1fb]
                        text-[#2457a6]
                      `
                      : `
                        border-transparent
                        text-[#5e5a54]
                        hover:border-[#ddd9d1]
                        hover:bg-[#faf9f6]
                        hover:text-[#292724]
                      `
                  )}
                  aria-current={
                    isActive ? 'page' : undefined
                  }
                >
                  <Icon
                    className={cn(
                      'h-[17px] w-[17px] shrink-0',
                      isActive
                        ? 'text-[#2457a6]'
                        : 'text-[#706b64]'
                    )}
                    strokeWidth={1.8}
                  />

                  <span>{item.name}</span>
                </NavLink>
              );
            })}

          </div>
        </div>
      )}
    </aside>
  );
}