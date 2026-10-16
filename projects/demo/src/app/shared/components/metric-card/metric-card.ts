import { Component, input } from '@angular/core';
import { MetricCardConfig } from '@app/shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-metric-card',
  styleUrl: './metric-card.scss',
  templateUrl: './metric-card.html',
})
export class MetricCard {
  readonly config = input.required<MetricCardConfig>();
}

