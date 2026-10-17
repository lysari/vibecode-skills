import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Chatbot } from '@app/shared/components/chatbot/chatbot';
import { LiquidButton } from '@app/shared/components/liquid-button/liquid-button';
import { LiquidMenuContent } from '@app/shared/components/liquid-menu-popup/liquid-menu-content.directive';
import { LiquidMenuItem } from '@app/shared/components/liquid-menu-popup/liquid-menu-item.directive';
import { LiquidMenuPopup } from '@app/shared/components/liquid-menu-popup/liquid-menu-popup';
import { LiquidMenuTrigger } from '@app/shared/components/liquid-menu-popup/liquid-menu-trigger.directive';
import { toast } from '@app/shared/components/liquid-toast/toast';
import { Notification } from '@app/shared/components/notification/notification';
import { NotificationStore } from '@app/shared/components/notification/notification.store';
import { WORKSPACE_HEADER } from '@app/shared/constants/dashboard';
import { WorkspaceHeaderConfig } from '@app/shared/interfaces/dashboard.interface';

@Component({
  imports: [
    RouterLink,
    LiquidButton,
    LiquidMenuPopup,
    LiquidMenuTrigger,
    LiquidMenuItem,
    LiquidMenuContent,
    Notification,
    Chatbot,
  ],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  readonly config = input<WorkspaceHeaderConfig>(WORKSPACE_HEADER);
  protected readonly notificationStore = inject(NotificationStore);

  protected readonly selectedProject = signal('Monalisa');
  protected readonly projects = ['Monalisa', 'Production DB', 'Staging Branch', 'Analytics DB'];

  protected selectProject(name: string): void {
    this.selectedProject.set(name);
    toast.info(`Switched to project: ${name}`);
  }

  protected createProject(): void {
    toast.info('New project creation dialog coming soon');
  }

  protected onAccountAction(action: string): void {
    switch (action) {
      case 'profile':
        toast.info(`Viewing profile for ${this.config().accountEmail}`);
        break;
      case 'billing':
        toast.info(`Current plan: ${this.config().accountPlan} Tier`);
        break;
      case 'settings':
        toast.info('Opening user settings');
        break;
      case 'signout':
        toast.warning(`Signed out of ${this.config().accountEmail}`);
        break;
    }
  }

  protected onConnect(): void {
    toast.success('Connection string copied to clipboard!');
  }
}

