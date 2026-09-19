import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  Bell,
  LogOut,
  Radio,
  UserRound,
  ChevronDown,
} from 'lucide-react';
import { useWebSocketStore } from '../../store/uiStore';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../ui';

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
    {
      id: '1',
      type: 'critical_incident',
      message: 'Critical flood incident reported in Sector 7',
      time: '2 min ago',
      read: false,
    },
    {
      id: '2',
      type: 'escalation',
      message: 'Incident INC-2024-001 escalated - SLA breach',
      time: '15 min ago',
      read: false,
    },
    {
      id: '3',
      type: 'resource_shortage',
      message: 'No ambulances available for Sector 3',
      time: '1 hour ago',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(
    (n) => !n.read
  ).length;

  const getPageTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (
        location.pathname === path ||
        (path !== '/' &&
          location.pathname.startsWith(path))
      ) {
        return title;
      }
    }

    return 'EmergencyOps';
  };

  const getConnectionState = () => {
    if (connected) {
      return {
        label: 'LIVE',
        dot: 'bg-[#15803d]',
        text: 'text-[#166534]',
        background: 'bg-[#edf8f0]',
        border: 'border-[#cde8d3]',
      };
    }

    if (connecting) {
      return {
        label: 'CONNECTING',
        dot: 'bg-[#b45309] animate-pulse',
        text: 'text-[#92400e]',
        background: 'bg-[#fff8e8]',
        border: 'border-[#f0dfb5]',
      };
    }

    return {
      label: 'OFFLINE',
      dot: 'bg-[#b91c1c]',
      text: 'text-[#991b1b]',
      background: 'bg-[#fff1f1]',
      border: 'border-[#f0cccc]',
    };
  };

  const connection = getConnectionState();

  return (
    <header
      className="
        sticky
        top-0
        z-30
        h-[72px]
        border-b
        border-[#dfddd7]
        bg-[#f8f7f4]/95
        supports-[backdrop-filter]:bg-[#f8f7f4]/85
        supports-[backdrop-filter]:backdrop-blur-md
      "
    >
      <div
        className="
          flex
          h-full
          items-center
          justify-between
          px-5
          lg:px-7
        "
      >

        {/* =================================================
            LEFT — PAGE IDENTITY
        ================================================= */}

        <div className="flex min-w-0 items-center gap-4">

          {/* Small command marker */}
          <div
            className="
              hidden
              h-8
              w-[3px]
              rounded-full
              bg-[#2457a6]
              sm:block
            "
          />

          <div className="min-w-0">

            <div
              className="
                font-display
                text-[21px]
                font-semibold
                leading-none
                tracking-[-0.035em]
                text-[#201e1b]
              "
            >
              {getPageTitle()}
            </div>

            <div
              className="
                mt-1
                hidden
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-[#969188]
                sm:block
              "
            >
              Emergency Response Command
            </div>

          </div>
        </div>


        {/* =================================================
            RIGHT — SYSTEM STATUS + NOTIFICATIONS + USER
        ================================================= */}

        <div className="flex items-center gap-2 sm:gap-3">

          {/* -----------------------------------------------
              LIVE CONNECTION
          ----------------------------------------------- */}

          <div
            className={cn(
              `
                hidden
                h-9
                items-center
                gap-2
                rounded-full
                border
                px-3
                md:flex
              `,
              connection.background,
              connection.border
            )}
          >
            <Radio
              className={cn(
                'h-[14px] w-[14px]',
                connection.text
              )}
              strokeWidth={2}
            />

            <span
              className={cn(
                `
                  text-[9px]
                  font-semibold
                  tracking-[0.1em]
                `,
                connection.text
              )}
            >
              {connection.label}
            </span>

            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                connection.dot
              )}
            />
          </div>


          {/* -----------------------------------------------
              NOTIFICATIONS
          ----------------------------------------------- */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="
                  relative
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-[9px]
                  border
                  border-transparent
                  text-[#706b64]
                  transition-all
                  duration-150
                  hover:border-[#dfddd7]
                  hover:bg-[#efede8]
                  hover:text-[#292724]
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#2457a6]
                "
                aria-label="Notifications"
              >
                <Bell
                  className="h-[18px] w-[18px]"
                  strokeWidth={1.8}
                />

                {unreadCount > 0 && (
                  <span
                    className="
                      absolute
                      right-[3px]
                      top-[2px]
                      flex
                      h-[15px]
                      min-w-[15px]
                      items-center
                      justify-center
                      rounded-full
                      border-2
                      border-[#f8f7f4]
                      bg-[#b91c1c]
                      px-0.5
                      text-[8px]
                      font-bold
                      leading-none
                      text-white
                    "
                  >
                    {unreadCount > 9
                      ? '9+'
                      : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="
                w-[350px]
                rounded-xl
                border-[#dedbd4]
                bg-[#fffefa]
                p-1.5
                shadow-lg
              "
            >
              <div className="px-3 py-2.5">

                <div className="flex items-center justify-between">

                  <DropdownMenuLabel
                    className="
                      p-0
                      font-display
                      text-[16px]
                      font-semibold
                      tracking-[-0.02em]
                      text-[#201e1b]
                    "
                  >
                    Notifications
                  </DropdownMenuLabel>

                  {unreadCount > 0 && (
                    <span
                      className="
                        rounded-full
                        bg-[#fff1f1]
                        px-2
                        py-1
                        text-[9px]
                        font-semibold
                        uppercase
                        tracking-[0.08em]
                        text-[#991b1b]
                      "
                    >
                      {unreadCount} unread
                    </span>
                  )}

                </div>

              </div>

              <DropdownMenuSeparator />

              {notifications.length === 0 ? (
                <DropdownMenuItem
                  className="
                    py-4
                    text-sm
                    text-[#817c74]
                  "
                >
                  No notifications
                </DropdownMenuItem>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className={cn(
                      `
                        cursor-pointer
                        rounded-lg
                        px-3
                        py-3
                        focus:bg-[#f5f3ee]
                      `,
                      !n.read && 'bg-[#faf9f6]'
                    )}
                  >
                    <div className="flex w-full items-start gap-3">

                      <div
                        className={cn(
                          `
                            mt-1.5
                            h-2
                            w-2
                            shrink-0
                            rounded-full
                          `,
                          n.type ===
                            'critical_incident' &&
                            'bg-[#b91c1c]',
                          n.type === 'escalation' &&
                            'bg-[#c2410c]',
                          n.type ===
                            'resource_shortage' &&
                            'bg-[#b45309]'
                        )}
                      />

                      <div className="min-w-0 flex-1">

                        <p
                          className={cn(
                            `
                              text-[13px]
                              leading-5
                              text-[#3f3b36]
                            `,
                            !n.read &&
                              'font-semibold text-[#201e1b]'
                          )}
                        >
                          {n.message}
                        </p>

                        <p
                          className="
                            mt-1
                            font-mono
                            text-[9px]
                            tracking-[0.01em]
                            text-[#969188]
                          "
                        >
                          {n.time}
                        </p>

                      </div>

                    </div>
                  </DropdownMenuItem>
                ))
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="
                  justify-center
                  rounded-lg
                  py-2.5
                  text-[12px]
                  font-semibold
                  text-[#2457a6]
                  focus:bg-[#eef4ff]
                "
              >
                View all notifications
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>


          {/* -----------------------------------------------
              OPERATOR
          ----------------------------------------------- */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="
                  group
                  flex
                  h-10
                  items-center
                  gap-2
                  rounded-[10px]
                  border
                  border-transparent
                  px-1.5
                  transition-all
                  duration-150
                  hover:border-[#dfddd7]
                  hover:bg-[#efede8]
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#2457a6]
                "
                aria-label="User menu"
              >

                {/* Avatar */}
                <div
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-[9px]
                    bg-[#183b63]
                    font-display
                    text-[12px]
                    font-bold
                    tracking-[-0.02em]
                    text-white
                  "
                >
                  OP
                </div>

                {/* Operator information */}
                <div className="hidden text-left lg:block">

                  <div
                    className="
                      text-[12px]
                      font-semibold
                      leading-none
                      text-[#292724]
                    "
                  >
                    Operator
                  </div>

                  <div
                    className="
                      mt-1
                      text-[9px]
                      font-medium
                      uppercase
                      tracking-[0.08em]
                      text-[#969188]
                    "
                  >
                    Command Desk
                  </div>

                </div>

                <ChevronDown
                  className="
                    hidden
                    h-3.5
                    w-3.5
                    text-[#969188]
                    lg:block
                  "
                  strokeWidth={1.8}
                />

              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="
                w-52
                rounded-xl
                border-[#dedbd4]
                bg-[#fffefa]
                p-1.5
                shadow-lg
              "
            >

              <DropdownMenuLabel
                className="
                  px-3
                  py-2.5
                "
              >
                <div
                  className="
                    font-display
                    text-[15px]
                    font-semibold
                    tracking-[-0.02em]
                    text-[#201e1b]
                  "
                >
                  Operator
                </div>

                <div
                  className="
                    mt-1
                    text-[9px]
                    font-semibold
                    uppercase
                    tracking-[0.1em]
                    text-[#969188]
                  "
                >
                  Command Desk
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem className="rounded-lg">
                <UserRound
                  className="mr-2 h-4 w-4"
                />
                Profile
              </DropdownMenuItem>

              <DropdownMenuItem className="rounded-lg">
                Preferences
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() =>
                  console.log('logout')
                }
                className="
                  rounded-lg
                  text-[#991b1b]
                  focus:bg-[#fff1f1]
                  focus:text-[#991b1b]
                "
              >
                <LogOut
                  className="mr-2 h-4 w-4"
                />
                Sign out
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  );
}