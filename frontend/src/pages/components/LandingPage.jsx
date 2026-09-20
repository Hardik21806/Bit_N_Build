import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  ChevronRight,
  CircleDot,
  Clock3,
  Command,
  Map,
  Radio,
  Siren,
  Truck,
  Users,
  Zap,
} from 'lucide-react';

import { useDashboardOverview } from '../../hooks';

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
      {children}
    </div>
  );
}

function StatusDot({ active = false }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {active && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
          active ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      />
    </span>
  );
}

function SeverityBadge({ severity }) {
  const value = String(severity || '').toLowerCase();

  const styles = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
        styles[value] || 'bg-slate-50 text-slate-600 border-slate-200'
      }`}
    >
      {severity || 'Unknown'}
    </span>
  );
}

function OperationalPreview({ incidents }) {
  const visibleIncidents = Array.isArray(incidents)
    ? incidents.slice(0, 4)
    : [];

  return (
    <div className="relative">
      {/* Decorative structure */}
      <div className="absolute -right-8 -top-8 h-24 w-24 border-r border-t border-slate-300" />
      <div className="absolute -bottom-8 -left-8 h-24 w-24 border-b border-l border-slate-300" />

      <div className="relative overflow-hidden border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
        {/* Window header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-3">
            <Command size={15} className="text-slate-700" />

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                Operations View
              </div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                Live operational feed
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusDot active />
            <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-600">
              Live
            </span>
          </div>
        </div>

        {/* Main preview */}
        <div className="grid min-h-[390px] grid-cols-[1.35fr_0.65fr]">
          {/* Map-like operational area */}
          <div className="relative overflow-hidden border-r border-slate-200 bg-[#eef2f1]">
            {/* grid */}
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  'linear-gradient(#cbd5d1 1px, transparent 1px), linear-gradient(90deg, #cbd5d1 1px, transparent 1px)',
                backgroundSize: '38px 38px',
              }}
            />

            {/* road lines */}
            <div className="absolute left-[15%] top-0 h-full w-[2px] rotate-[22deg] bg-white/80" />
            <div className="absolute left-[48%] top-0 h-full w-[3px] -rotate-[12deg] bg-white/90" />
            <div className="absolute left-0 top-[58%] h-[3px] w-full -rotate-[4deg] bg-white/90" />
            <div className="absolute left-0 top-[28%] h-[2px] w-full rotate-[9deg] bg-white/70" />

            {/* map label */}
            <div className="absolute left-5 top-5 flex items-center gap-2 border border-slate-300 bg-white/90 px-3 py-2">
              <Map size={13} className="text-slate-600" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                Situational map
              </span>
            </div>

            {/* markers based on real incidents */}
            {visibleIncidents.length > 0 ? (
              visibleIncidents.map((incident, index) => {
                const positions = [
                  'left-[28%] top-[34%]',
                  'left-[61%] top-[23%]',
                  'left-[46%] top-[66%]',
                  'left-[73%] top-[61%]',
                ];

                return (
                  <div
                    key={incident.id || index}
                    className={`absolute ${positions[index] || positions[0]}`}
                  >
                    <div className="relative">
                      <span className="absolute -inset-2 animate-pulse rounded-full bg-red-500/10" />
                      <div className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-md">
                        <Siren size={12} className="text-white" />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border border-slate-300 bg-white/90 px-5 py-4 text-center">
                  <Map size={18} className="mx-auto mb-2 text-slate-400" />
                  <p className="text-xs font-medium text-slate-600">
                    No active incidents
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Live map data will appear here
                  </p>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4 border border-slate-300 bg-white/90 px-3 py-2">
              <div className="font-mono text-[9px] text-slate-500">
                INCIDENT LOCATIONS
              </div>
            </div>
          </div>

          {/* Incident feed */}
          <div className="bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                  Active feed
                </span>
                <Activity size={14} className="text-slate-400" />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {visibleIncidents.length > 0 ? (
                visibleIncidents.map((incident) => (
                  <div key={incident.id} className="px-4 py-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="font-mono text-[9px] text-slate-400">
                        {incident.id || 'INCIDENT'}
                      </span>

                      <SeverityBadge severity={incident.severity} />
                    </div>

                    <p className="line-clamp-2 text-xs font-medium leading-5 text-slate-800">
                      {incident.description || 'Emergency incident'}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-400">
                      <CircleDot size={10} />
                      {incident.status || 'Unknown status'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-10 text-center">
                  <Activity
                    size={18}
                    className="mx-auto mb-2 text-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    No active incidents
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer status */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <StatusDot active />
            <span className="text-[10px] font-medium text-slate-600">
              Operational systems connected
            </span>
          </div>

          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
            EmergencyOps
          </span>
        </div>
      </div>
    </div>
  );
}

function WorkflowStep({ number, title, description, icon: Icon }) {
  return (
    <div className="group relative border-l border-slate-200 pl-5">
      <div className="mb-5 flex h-9 w-9 items-center justify-center border border-slate-300 bg-white text-slate-700 transition-colors group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white">
        <Icon size={15} />
      </div>

      <div className="font-mono text-[10px] tracking-[0.16em] text-slate-400">
        {number}
      </div>

      <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 max-w-[220px] text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function Capability({ icon: Icon, number, title, description, large }) {
  return (
    <div
      className={`group border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_35px_rgba(15,23,42,0.06)] ${
        large ? 'md:p-8' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50 text-slate-700 transition-colors group-hover:bg-slate-900 group-hover:text-white">
          <Icon size={18} />
        </div>

        <span className="font-mono text-[10px] text-slate-300">
          {number}
        </span>
      </div>

      <h3 className="mt-8 font-display text-xl font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 transition-colors group-hover:text-slate-800">
        Operational capability
        <ArrowRight
          size={12}
          className="transition-transform group-hover:translate-x-1"
        />
      </div>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();

  const {
    data: overview,
    isLoading,
    isError,
  } = useDashboardOverview();

  const incidents = Array.isArray(overview?.incidents)
    ? overview.incidents
    : [];

  const activeIncidents = incidents.filter((incident) => {
    const status = String(incident?.status || '').toLowerCase();

    return !['resolved', 'completed', 'closed', 'cancelled'].includes(status);
  });

  const criticalIncidents = activeIncidents.filter((incident) => {
    const severity = String(incident?.severity || '').toLowerCase();

    return severity === 'critical';
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f7f5] text-slate-900">
      {/* ───────────────── HERO ───────────────── */}
      <section className="relative overflow-hidden border-b border-slate-200">
        {/* editorial side line */}
        <div className="absolute bottom-0 left-[7%] top-0 hidden w-px bg-slate-200 lg:block" />
        <div className="absolute bottom-0 right-[7%] top-0 hidden w-px bg-slate-200 lg:block" />

        <div className="mx-auto max-w-[1440px] px-6 pb-20 pt-10 sm:px-8 lg:px-12 lg:pb-28 lg:pt-14">
          {/* top utility row */}
          <div className="mb-20 flex items-center justify-between lg:mb-24">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-slate-900 text-white">
                <Siren size={17} />
              </div>

              <div>
                <div className="font-display text-base font-bold tracking-tight">
                  EmergencyOps
                </div>
                <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-400">
                  Response coordination
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <StatusDot active />
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-slate-500">
                Systems operational
              </span>
            </div>
          </div>

          <div className="grid items-center gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            {/* Copy */}
            <div className="relative">
              <SectionLabel>Emergency operations platform</SectionLabel>

              <h1 className="mt-7 max-w-3xl font-display text-[clamp(3.4rem,6.5vw,6.7rem)] font-bold leading-[0.91] tracking-[-0.055em] text-slate-950">
                One operational view.
                <span className="block text-slate-400">
                  Every emergency response.
                </span>
              </h1>

              <p className="mt-8 max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
                Coordinate incidents, response resources, field operations and
                alerts from a single operational system built for situations
                where every update matters.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="group inline-flex h-12 items-center justify-center gap-3 bg-slate-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Open operations
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/incidents/report')}
                  className="inline-flex h-12 items-center justify-center gap-3 border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-500"
                >
                  Report incident
                </button>
              </div>

              <div className="mt-10 flex items-center gap-5 border-t border-slate-200 pt-5">
                <div className="flex items-center gap-2">
                  <Radio size={14} className="text-emerald-600" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                    Live data
                  </span>
                </div>

                <div className="h-3 w-px bg-slate-300" />

                <div className="flex items-center gap-2">
                  <Zap size={13} className="text-slate-500" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                    Real-time coordination
                  </span>
                </div>
              </div>
            </div>

            {/* Operational preview */}
            <OperationalPreview incidents={activeIncidents} />
          </div>
        </div>
      </section>

      {/* ───────────────── STATUS STRIP ───────────────── */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 lg:grid-cols-4">
          <div className="border-b border-slate-200 px-6 py-6 lg:border-b-0 lg:border-r">
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">
              Active incidents
            </div>

            <div className="mt-2 flex items-end gap-3">
              <span className="font-display text-3xl font-bold">
                {isLoading ? '—' : activeIncidents.length}
              </span>

              <span className="mb-1 text-[10px] text-slate-400">
                currently active
              </span>
            </div>
          </div>

          <div className="border-b border-slate-200 px-6 py-6 lg:border-b-0 lg:border-r">
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">
              Critical
            </div>

            <div className="mt-2 flex items-end gap-3">
              <span className="font-display text-3xl font-bold text-red-600">
                {isLoading ? '—' : criticalIncidents.length}
              </span>

              <span className="mb-1 text-[10px] text-slate-400">
                requiring attention
              </span>
            </div>
          </div>

          <div className="border-r-0 px-6 py-6 lg:border-r">
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">
              Data connection
            </div>

            <div className="mt-3 flex items-center gap-2">
              <StatusDot active={!isError} />
              <span className="text-sm font-semibold text-slate-800">
                {isError ? 'Unavailable' : 'Connected'}
              </span>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">
              Response system
            </div>

            <div className="mt-3 flex items-center gap-2">
              <StatusDot active />
              <span className="text-sm font-semibold text-slate-800">
                Operational
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── WORKFLOW ───────────────── */}
      <section className="mx-auto max-w-[1440px] px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <SectionLabel>Response workflow</SectionLabel>

            <h2 className="mt-6 max-w-md font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-slate-950 sm:text-5xl">
              From report
              <span className="block text-slate-400">to response.</span>
            </h2>

            <p className="mt-6 max-w-sm text-sm leading-6 text-slate-500">
              A connected operational flow keeps incident information and
              response activity visible throughout the lifecycle.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
            <WorkflowStep
              number="01"
              title="Report"
              description="Capture an emergency incident and its available details."
              icon={AlertTriangle}
            />

            <WorkflowStep
              number="02"
              title="Classify"
              description="Understand the incident type, severity and operational status."
              icon={Activity}
            />

            <WorkflowStep
              number="03"
              title="Coordinate"
              description="Identify suitable response resources for the situation."
              icon={Users}
            />

            <WorkflowStep
              number="04"
              title="Dispatch"
              description="Assign resources and track their response progress."
              icon={Truck}
            />

            <WorkflowStep
              number="05"
              title="Resolve"
              description="Follow the incident through the response lifecycle."
              icon={CircleDot}
            />
          </div>
        </div>
      </section>

      {/* ───────────────── CAPABILITIES ───────────────── */}
      <section className="border-y border-slate-200 bg-[#eef1ef]">
        <div className="mx-auto max-w-[1440px] px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <SectionLabel>Core capabilities</SectionLabel>

              <h2 className="mt-6 max-w-2xl font-display text-4xl font-bold leading-[1] tracking-[-0.04em] text-slate-950 sm:text-5xl">
                Built around the response,
                <span className="block text-slate-500">
                  not the interface.
                </span>
              </h2>
            </div>

            <p className="max-w-sm text-sm leading-6 text-slate-500">
              The platform brings the operational pieces together without
              burying critical information behind unnecessary complexity.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Capability
              number="01"
              icon={Siren}
              title="Incident Command"
              description="Manage emergency incidents, severity, status, locations and response information from one operational view."
              large
            />

            <Capability
              number="02"
              icon={Truck}
              title="Resource Coordination"
              description="Monitor available response resources and connect them to active incidents."
            />

            <Capability
              number="03"
              icon={Map}
              title="Live Situational Map"
              description="Understand where incidents are happening through geographic operational context."
            />

            <Capability
              number="04"
              icon={BellRing}
              title="Alerts & Escalation"
              description="Surface operational alerts and keep important events visible to response teams."
            />

            <Capability
              number="05"
              icon={BarChart3}
              title="Operational Analytics"
              description="Review incident patterns, response performance, resource readiness and affected areas."
            />

            <Capability
              number="06"
              icon={Radio}
              title="Real-Time Updates"
              description="Keep the operational interface synchronized with backend events through live communication."
            />
          </div>
        </div>
      </section>

      {/* ───────────────── LIVE OPERATIONS ───────────────── */}
      <section className="mx-auto max-w-[1440px] px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid items-center gap-14 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <SectionLabel>Live operations</SectionLabel>

            <h2 className="mt-6 max-w-lg font-display text-4xl font-bold leading-[1] tracking-[-0.04em] sm:text-5xl">
              See the situation
              <span className="block text-slate-400">as it develops.</span>
            </h2>

            <p className="mt-6 max-w-md text-sm leading-6 text-slate-500">
              Incidents become easier to understand when operational status
              and geographical context are available together.
            </p>

            <button
              type="button"
              onClick={() => navigate('/map')}
              className="group mt-8 inline-flex items-center gap-2 border-b border-slate-900 pb-1 text-sm font-semibold text-slate-900"
            >
              Open map view
              <ChevronRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </div>

          <div className="relative overflow-hidden border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
            <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden bg-[#e9eeeb]">
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  backgroundImage:
                    'linear-gradient(#c8d2cd 1px, transparent 1px), linear-gradient(90deg, #c8d2cd 1px, transparent 1px)',
                  backgroundSize: '44px 44px',
                }}
              />

              <div className="relative border border-slate-300 bg-white px-8 py-7 text-center shadow-sm">
                <Map size={25} className="mx-auto mb-4 text-slate-700" />

                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-slate-400">
                  Live map
                </div>

                <div className="mt-2 font-display text-lg font-semibold text-slate-900">
                  {activeIncidents.length > 0
                    ? `${activeIncidents.length} active incident${
                        activeIncidents.length === 1 ? '' : 's'
                      }`
                    : 'No active incidents'}
                </div>

                <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                  Open the full map to inspect current incident locations and
                  operational context.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/map')}
                  className="mt-5 inline-flex items-center gap-2 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  View map
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── INCIDENT LIFECYCLE ───────────────── */}
      <section className="border-y border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-8 lg:px-12 lg:py-24">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <SectionLabel>Incident lifecycle</SectionLabel>

              <h2 className="mt-6 max-w-lg font-display text-4xl font-bold leading-[1] tracking-[-0.04em] sm:text-5xl">
                Keep the response
                <span className="block text-slate-500">moving forward.</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-5">
              {[
                ['01', 'Reported'],
                ['02', 'Verified'],
                ['03', 'Dispatched'],
                ['04', 'On scene'],
                ['05', 'Resolved'],
              ].map(([number, label], index) => (
                <div key={label} className="relative">
                  {index < 4 && (
                    <div className="absolute left-[calc(100%+8px)] top-4 hidden h-px w-5 bg-slate-700 sm:block" />
                  )}

                  <div className="font-mono text-[10px] text-slate-500">
                    {number}
                  </div>

                  <div className="mt-3 h-2 w-2 rounded-full bg-white" />

                  <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-200">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── ANALYTICS ───────────────── */}
      <section className="mx-auto max-w-[1440px] px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-[1fr_0.85fr] lg:items-end">
          <div>
            <SectionLabel>Operational intelligence</SectionLabel>

            <h2 className="mt-6 max-w-2xl font-display text-4xl font-bold leading-[1] tracking-[-0.04em] sm:text-5xl">
              Turn response history
              <span className="block text-slate-400">
                into operational insight.
              </span>
            </h2>

            <p className="mt-6 max-w-lg text-sm leading-6 text-slate-500">
              Review operational patterns through the existing analytics
              workspace and use the information available in your response
              data to understand what is happening.
            </p>

            <button
              type="button"
              onClick={() => navigate('/analytics')}
              className="group mt-8 inline-flex items-center gap-2 bg-slate-900 px-5 py-3 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Explore analytics
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </div>

          <div className="grid grid-cols-2 border-l border-t border-slate-200 bg-white">
            <div className="border-b border-r border-slate-200 p-6">
              <BarChart3 size={19} className="text-slate-700" />
              <div className="mt-10 font-display text-lg font-semibold">
                Incident trends
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Understand the distribution of emergency activity.
              </p>
            </div>

            <div className="border-b border-slate-200 p-6">
              <Clock3 size={19} className="text-slate-700" />
              <div className="mt-10 font-display text-lg font-semibold">
                Response performance
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Examine available response timing information.
              </p>
            </div>

            <div className="border-r border-slate-200 p-6">
              <Truck size={19} className="text-slate-700" />
              <div className="mt-10 font-display text-lg font-semibold">
                Resource readiness
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Monitor resource availability and operational status.
              </p>
            </div>

            <div className="p-6">
              <Map size={19} className="text-slate-700" />
              <div className="mt-10 font-display text-lg font-semibold">
                Affected areas
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Examine where incidents are occurring.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── CTA ───────────────── */}
      <section className="border-t border-slate-200 bg-[#eef1ef]">
        <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
            <div>
              <SectionLabel>Ready when it matters</SectionLabel>

              <h2 className="mt-6 max-w-3xl font-display text-5xl font-bold leading-[0.95] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
                Ready for the
                <span className="block text-slate-400">next incident.</span>
              </h2>
            </div>

            <div className="max-w-sm">
              <p className="text-sm leading-6 text-slate-500">
                Keep incidents, resources and response teams connected from
                the first report through resolution.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex h-11 items-center justify-center gap-2 bg-slate-900 px-5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Open dashboard
                  <ArrowRight size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/incidents/report')}
                  className="inline-flex h-11 items-center justify-center gap-2 border border-slate-300 bg-white px-5 text-xs font-semibold text-slate-800 hover:border-slate-500"
                >
                  Report an incident
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── FOOTER ───────────────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 px-6 py-7 sm:px-8 md:flex-row lg:px-12">
          <div>
            <div className="font-display text-sm font-bold">EmergencyOps</div>
            <div className="mt-1 text-[10px] text-slate-400">
              Intelligent emergency response coordination
            </div>
          </div>

          <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400">
            Operational response platform
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;