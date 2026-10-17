import {
  Component,
  ElementRef,
  HostListener,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LiquidMenuContent } from '@app/shared/components/liquid-menu-popup/liquid-menu-content.directive';
import { LiquidMenuItem } from '@app/shared/components/liquid-menu-popup/liquid-menu-item.directive';
import { LiquidMenuPopup } from '@app/shared/components/liquid-menu-popup/liquid-menu-popup';
import { LiquidMenuTrigger } from '@app/shared/components/liquid-menu-popup/liquid-menu-trigger.directive';
import { toast } from '@app/shared/components/liquid-toast/toast';
import { Search } from '@app/shared/components/search/search';
import { NAV_SECTIONS, SIDEBAR_SEARCH_ITEMS } from '@app/shared/constants/dashboard';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { NavSection } from '@app/shared/interfaces/dashboard.interface';

@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    LiquidPressable,
    LiquidMenuPopup,
    LiquidMenuTrigger,
    LiquidMenuItem,
    LiquidMenuContent,
    Search,
  ],
  selector: 'app-sidebar',
  styleUrl: './sidebar.scss',
  templateUrl: './sidebar.html',
})
export class Sidebar {
  readonly sections = input<NavSection[]>(NAV_SECTIONS);
  protected readonly searchItems = SIDEBAR_SEARCH_ITEMS;

  protected readonly currentBranch = signal('production');
  protected readonly branches = ['production', 'staging', 'preview-feature-auth', 'dev'];

  private readonly searchMenu = viewChild<LiquidMenuPopup>('searchMenu');
  private readonly searchTrigger = viewChild<ElementRef<HTMLElement>>('searchTrigger');

  @HostListener('window:keydown', ['$event'])
  protected onWindowKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const isEditing =
      target?.tagName === 'INPUT' ||
      target?.tagName === 'TEXTAREA' ||
      target?.isContentEditable;

    if (event.key === '/' && !isEditing) {
      event.preventDefault();
      const triggerEl = this.searchTrigger()?.nativeElement;
      if (triggerEl) {
        this.searchMenu()?.openFor(triggerEl);
      }
    }
  }

  protected selectBranch(branch: string): void {
    this.currentBranch.set(branch);
    toast.info(`Switched to branch: ${branch}`);
  }

  protected createBranch(): void {
    toast.info('New branch creation wizard');
  }

  protected onNavClick(label: string): void {
    toast.info(`${label} is in preview`);
  }
}

