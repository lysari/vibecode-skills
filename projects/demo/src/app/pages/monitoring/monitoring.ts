import { Component } from '@angular/core';
import { MetricCard } from '@app/shared/components/metric-card/metric-card';
import { PageHeader } from '@app/shared/components/page-header/page-header';
import { ResourceCard } from '@app/shared/components/resource-card/resource-card';
import {
  METRIC_CARDS,
  MONITORING_HEADER,
  RESOURCE_CARD,
} from '@app/shared/constants/dashboard';

@Component({
  imports: [PageHeader, ResourceCard, MetricCard],
  selector: 'app-monitoring',
  styleUrl: './monitoring.scss',
  templateUrl: './monitoring.html',
})
export class Monitoring {
  protected readonly header = MONITORING_HEADER;
  protected readonly resourceCard = RESOURCE_CARD;
  protected readonly metricCards = METRIC_CARDS;
}
