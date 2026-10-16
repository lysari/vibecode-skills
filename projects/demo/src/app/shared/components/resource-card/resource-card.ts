import { Component, input } from '@angular/core';
import { ResourceCardConfig } from '@app/shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-resource-card',
  styleUrl: './resource-card.scss',
  templateUrl: './resource-card.html',
})
export class ResourceCard {
  readonly config = input.required<ResourceCardConfig>();
}

