import { Routes } from '@angular/router';
import { Monitoring } from './pages/monitoring/monitoring';

export const routes: Routes = [
  { path: '', component: Monitoring, title: 'Monitoring & Insights' },
  { path: 'monitoring', component: Monitoring, title: 'Monitoring & Insights' },
];
