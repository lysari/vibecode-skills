import {
  MetricCardConfig,
  NavSection,
  PageHeaderConfig,
  ResourceCardConfig,
  WorkspaceHeaderConfig,
} from '../interfaces/dashboard.interface';

export const WORKSPACE_HEADER: WorkspaceHeaderConfig = {
  accountEmail: 'cansaas@gmail.com',
  accountPlan: 'Free',
  projectName: 'Monalisa',
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Project',
    items: [
      { id: 'overview', label: 'Overview', icon: 'home' },
      { id: 'environments', label: 'Environments', icon: 'environments' },
      { id: 'integrations', label: 'Integrations', icon: 'integrations' },
      { id: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
  {
    title: 'Branch',
    branch: 'production',
    items: [
      { id: 'branch-overview', label: 'Overview', icon: 'grid' },
      { id: 'monitoring', label: 'Monitoring', icon: 'monitoring', route: '/' },
      { id: 'sql-editor', label: 'SQL Editor', icon: 'star' },
      { id: 'configuration', label: 'Configuration', icon: 'cube' },
      { id: 'backup-restore', label: 'Backup & Restore', icon: 'history' },
      { id: 'data-masking', label: 'Data Masking', icon: 'mask' },
    ],
  },
  {
    title: 'Platform Services',
    items: [
      { id: 'api-access', label: 'API Access', icon: 'api' },
      { id: 'authentication', label: 'Authentication', icon: 'key' },
    ],
  },
];

export const MONITORING_HEADER: PageHeaderConfig = {
  title: 'Monitoring & Insights',
  subtitle: 'Track infrastructure health and resource utilization',
  ranges: ['1h', '6h', '24h', '7d'],
  activeRange: '24h',
  computeName: 'Primary',
  computeStatus: 'Active',
  endpointMeta: ['ep-monalisa-prod-a4f9', 'Postgres 17', 'AWS us-east-2'],
};

export const RESOURCE_CARD: ResourceCardConfig = {
  title: 'Resource Configuration',
  subtitle: 'Autoscaling & suspension limits',
  badge: '0.25 – 2 CU',
  statusText: 'Healthy · Autoscaling active',
  items: [
    {
      id: 'base-capacity',
      title: 'Base Capacity',
      subtitle: 'Minimum compute capacity allocated',
      value: '0.25 CU',
      icon: 'capacity',
    },
    {
      id: 'scaling-limit',
      title: 'Scaling Limit',
      subtitle: 'Maximum compute boundary for autoscaling',
      value: '2.00 CU',
      icon: 'limit',
    },
    {
      id: 'idle-timeout',
      title: 'Idle Timeout',
      subtitle: 'Endpoint suspended after period of inactivity',
      value: '5 min',
      icon: 'timeout',
    },
  ],
};

export const METRIC_CARDS: MetricCardConfig[] = [
  {
    id: 'compute',
    variant: 'compute',
    title: 'Compute Utilization',
    subtitle: 'Compute Units (CU) & RAM',
    badge: 'Avg 0.50 CU',
    kpis: [
      { label: 'Current Load', value: '0.50 CU' },
      { label: 'Allocated RAM', value: '2.0 GB' },
      { label: 'Peak (24h)', value: '1.25 CU' },
    ],
    yAxis: ['2.0', '1.0', '0'],
    xAxis: ['12:00', '14:00', '16:00', 'Now'],
    bars: [
      { id: 'c1', heightPercent: 38 },
      { id: 'c2', heightPercent: 52 },
      { id: 'c3', heightPercent: 76, isPeak: true },
      { id: 'c4', heightPercent: 62 },
      { id: 'c5', heightPercent: 45 },
      { id: 'c6', heightPercent: 34 },
      { id: 'c7', heightPercent: 48, isPeak: true },
    ],
  },
  {
    id: 'conflicts',
    variant: 'conflicts',
    title: 'Transaction Conflicts',
    subtitle: 'Count',
    badge: '2 events',
    yAxis: ['1', '0.50', '0'],
    xAxis: ['12:00', '14:00', '16:00', 'Now'],
    bars: [
      {
        id: 't1',
        segments: ['primary', 'light', 'light', 'light', 'light', 'light', 'light', 'light'],
      },
      {
        id: 't2',
        segments: ['primary', 'light', 'light'],
      },
      { id: 't3', segments: [] },
      { id: 't4', segments: [] },
      { id: 't5', segments: [] },
      { id: 't6', segments: [] },
      { id: 't7', segments: [] },
    ],
  },
  {
    id: 'connections',
    variant: 'connections',
    title: 'Database Connections',
    subtitle: 'Active & Idle Sessions',
    badge: '14 / 100 max',
    yAxis: ['20', '10', '0'],
    xAxis: ['12:00', '14:00', '16:00', 'Now'],
    bars: [
      { id: 'd1', heightPercent: 45 },
      { id: 'd2', heightPercent: 68, isPeak: true },
      { id: 'd3', heightPercent: 74, isPeak: true },
      { id: 'd4', heightPercent: 55 },
      { id: 'd5', heightPercent: 42 },
      { id: 'd6', heightPercent: 50 },
      { id: 'd7', heightPercent: 64, isPeak: true },
    ],
  },
];
