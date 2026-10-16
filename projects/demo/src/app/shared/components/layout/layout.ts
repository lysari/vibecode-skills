import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { DocsSidebar } from '../docs-sidebar/docs-sidebar';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  imports: [DocsSidebar, Header, Sidebar],
  selector: 'app-layout',
  styleUrl: './layout.scss',
  templateUrl: './layout.html',
})
export class Layout {
  private readonly router = inject(Router);

  readonly isDocs = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url.includes('components-docs')),
      startWith(this.router.url.includes('components-docs')),
    ),
    { initialValue: this.router.url.includes('components-docs') },
  );
}
