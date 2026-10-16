import { Component, input } from '@angular/core';
import { PageHeaderConfig } from '@app/shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-page-header',
  styleUrl: './page-header.scss',
  templateUrl: './page-header.html',
})
export class PageHeader {
  readonly config = input.required<PageHeaderConfig>();
}

