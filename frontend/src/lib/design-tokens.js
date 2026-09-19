export const colors = {
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  severity: {
    critical: {
      DEFAULT: '#b91c1c',
      light: '#fef2f2',
      dark: '#7f1d1d',
      text: '#991b1b',
    },
    high: {
      DEFAULT: '#c2410c',
      light: '#fff7ed',
      dark: '#7c2d12',
      text: '#9a3412',
    },
    medium: {
      DEFAULT: '#b45309',
      light: '#fefce8',
      dark: '#713f12',
      text: '#854d0e',
    },
    low: {
      DEFAULT: '#166534',
      light: '#f0fdf4',
      dark: '#14532d',
      text: '#15803d',
    },
  },
  status: {
    reported: { DEFAULT: '#3b82f6', light: '#eff6ff', text: '#1d4ed8' },
    verified: { DEFAULT: '#0ea5e9', light: '#f0f9ff', text: '#0284c7' },
    dispatched: { DEFAULT: '#8b5cf6', light: '#f5f3ff', text: '#7c3aed' },
    in_progress: { DEFAULT: '#d97706', light: '#fffbeb', text: '#b45309' },
    resolved: { DEFAULT: '#16a34a', light: '#f0fdf4', text: '#15803d' },
    closed: { DEFAULT: '#6b7280', light: '#f9fafb', text: '#4b5563' },
    duplicate: { DEFAULT: '#ef4444', light: '#fef2f2', text: '#dc2626' },
  },
  resource: {
    available: { DEFAULT: '#16a34a', light: '#f0fdf4', text: '#15803d' },
    dispatched: { DEFAULT: '#3b82f6', light: '#eff6ff', text: '#1d4ed8' },
    maintenance: { DEFAULT: '#d97706', light: '#fffbeb', text: '#b45309' },
    unavailable: { DEFAULT: '#6b7280', light: '#f9fafb', text: '#4b5563' },
  },
  assignment: {
    assigned: { DEFAULT: '#3b82f6', light: '#eff6ff', text: '#1d4ed8' },
    en_route: { DEFAULT: '#0ea5e9', light: '#f0f9ff', text: '#0284c7' },
    on_scene: { DEFAULT: '#8b5cf6', light: '#f5f3ff', text: '#7c3aed' },
    completed: { DEFAULT: '#16a34a', light: '#f0fdf4', text: '#15803d' },
    cancelled: { DEFAULT: '#ef4444', light: '#fef2f2', text: '#dc2626' },
  },
  alert: {
    active: { DEFAULT: '#b91c1c', light: '#fef2f2', text: '#991b1b' },
    acknowledged: { DEFAULT: '#c2410c', light: '#fff7ed', text: '#9a3412' },
    resolved: { DEFAULT: '#16a34a', light: '#f0fdf4', text: '#15803d' },
  },
  primary: {
    DEFAULT: '#1e40af',
    hover: '#1e3a8a',
    light: '#eff6ff',
    text: '#1e40af',
  },
  background: {
    DEFAULT: '#ffffff',
    secondary: '#fafafa',
    tertiary: '#f5f5f5',
    elevated: '#ffffff',
  },
  border: {
    DEFAULT: '#e5e5e5',
    strong: '#d4d4d4',
    focus: '#1e40af',
  },
  text: {
    primary: '#171717',
    secondary: '#525252',
    muted: '#737373',
    inverse: '#ffffff',
  },
};

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};

export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  xl: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  DEFAULT: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
};

export const transitions = {
  fast: '150ms ease',
  DEFAULT: '200ms ease',
  slow: '300ms ease',
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
  toast: 1600,
};

export const severityOrder = ['critical', 'high', 'medium', 'low'];
export const statusOrder = ['reported', 'verified', 'dispatched', 'in_progress', 'resolved', 'closed', 'duplicate'];

export function getSeverityColor(severity) {
  return colors.severity[severity] || colors.severity.medium;
}

export function getStatusColor(status) {
  return colors.status[status] || colors.status.reported;
}

export function getResourceStatusColor(status) {
  return colors.resource[status] || colors.resource.unavailable;
}

export function getAssignmentStatusColor(status) {
  return colors.assignment[status] || colors.assignment.assigned;
}

export function getAlertStatusColor(status) {
  return colors.alert[status] || colors.alert.active;
}