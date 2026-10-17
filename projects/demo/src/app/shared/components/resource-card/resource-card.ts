import { Component, computed, input, signal } from '@angular/core';
import { LiquidButton } from '@app/shared/components/liquid-button/liquid-button';
import { LiquidMenuContent } from '@app/shared/components/liquid-menu-popup/liquid-menu-content.directive';
import { LiquidMenuPopup } from '@app/shared/components/liquid-menu-popup/liquid-menu-popup';
import { LiquidMenuTrigger } from '@app/shared/components/liquid-menu-popup/liquid-menu-trigger.directive';
import { LiquidSlider } from '@app/shared/components/liquid-slider/liquid-slider';
import { toast } from '@app/shared/components/liquid-toast/toast';
import { LiquidToggle } from '@app/shared/components/liquid-toggle/liquid-toggle';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { ResourceCardConfig } from '@app/shared/interfaces/dashboard.interface';

@Component({
  imports: [
    LiquidPressable,
    LiquidButton,
    LiquidMenuPopup,
    LiquidMenuTrigger,
    LiquidMenuContent,
    LiquidToggle,
    LiquidSlider,
  ],
  selector: 'app-resource-card',
  styleUrl: './resource-card.scss',
  templateUrl: './resource-card.html',
})
export class ResourceCard {
  readonly config = input.required<ResourceCardConfig>();

  protected readonly autoscaling = signal(true);
  protected readonly scalingLimit = signal(2.0);
  protected readonly idleTimeout = signal(5);

  protected readonly currentBadge = computed(() =>
    this.autoscaling()
      ? `0.25 – ${this.scalingLimit().toFixed(2)} CU`
      : `${this.scalingLimit().toFixed(2)} CU Fixed`,
  );

  protected readonly currentStatus = computed(() =>
    this.autoscaling()
      ? 'Healthy · Autoscaling active'
      : 'Healthy · Fixed capacity',
  );

  protected readonly items = computed(() => {
    return this.config().items.map((item) => {
      if (item.id === 'scaling-limit') {
        return { ...item, value: `${this.scalingLimit().toFixed(2)} CU` };
      }
      if (item.id === 'idle-timeout') {
        return {
          ...item,
          value: this.autoscaling() ? `${this.idleTimeout()} min` : 'Disabled',
        };
      }
      return item;
    });
  });

  protected applyChanges(menu: LiquidMenuPopup): void {
    menu.close('item');
    toast.success('Compute & autoscaling configuration updated!');
  }
}

