import { Component, input, signal } from '@angular/core';
import { LiquidButton } from '@app/shared/components/liquid-button/liquid-button';
import { LiquidTab } from '@app/shared/components/liquid-tabs/liquid-tab.directive';
import { LiquidTabs } from '@app/shared/components/liquid-tabs/liquid-tabs';
import { PageHeaderConfig } from '@app/shared/interfaces/dashboard.interface';

@Component({
  imports: [LiquidButton, LiquidTab, LiquidTabs],
  selector: 'app-page-header',
  styleUrl: './page-header.scss',
  templateUrl: './page-header.html',
})
export class PageHeader {
  readonly config = input.required<PageHeaderConfig>();
  readonly activeRange = signal<string>('24h');
}

