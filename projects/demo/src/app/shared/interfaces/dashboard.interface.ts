export type ResourceIcon = 'capacity' | 'limit' | 'timeout';

export type NavIcon =
  | 'home'
  | 'environments'
  | 'integrations'
  | 'settings'
  | 'grid'
  | 'monitoring'
  | 'star'
  | 'cube'
  | 'history'
  | 'mask'
  | 'api'
  | 'key';

export interface WorkspaceHeaderConfig {
  accountEmail: string;
  accountPlan: string;
  projectName: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: NavIcon;
  route?: string;
}

export interface NavSection {
  title: string;
  branch?: string;
  items: NavItem[];
}

export interface PageHeaderConfig {
  title: string;
  subtitle: string;
  ranges: string[];
  activeRange: string;
  computeName: string;
  computeStatus: string;
  endpointMeta: string[];
}

export interface ResourceConfig {
  id: string;
  title: string;
  subtitle: string;
  value: string;
  icon: ResourceIcon;
}

export interface ResourceCardConfig {
  title: string;
  subtitle: string;
  badge: string;
  statusText: string;
  items: ResourceConfig[];
}

export interface MetricKpi {
  label: string;
  value: string;
}

export interface ChartBar {
  id: string;
  heightPercent?: number;
  isPeak?: boolean;
  segments?: ('primary' | 'light')[];
}

export interface MetricCardConfig {
  id: string;
  variant: 'compute' | 'conflicts' | 'connections';
  title: string;
  subtitle: string;
  badge: string;
  kpis?: MetricKpi[];
  yAxis: string[];
  xAxis: string[];
  bars: ChartBar[];
}
