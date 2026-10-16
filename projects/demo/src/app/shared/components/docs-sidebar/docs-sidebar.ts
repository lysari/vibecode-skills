import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';

export interface DocLink {
  path: string;
  title: string;
  caption: string;
  category: 'primitives' | 'form-controls' | 'overlays' | 'feedback';
}

export interface DocGroup {
  title: string;
  category: 'primitives' | 'form-controls' | 'overlays' | 'feedback';
  links: DocLink[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LiquidPressable, RouterLink, RouterLinkActive],
  selector: 'app-docs-sidebar',
  styleUrl: './docs-sidebar.scss',
  templateUrl: './docs-sidebar.html',
})
export class DocsSidebar {
  protected readonly searchQuery = signal('');

  protected readonly groups: DocGroup[] = [
    {
      title: 'Primitives',
      category: 'primitives',
      links: [
        {
          path: '/components-docs/liquid-button',
          title: 'Liquid Button',
          caption: 'Squash & spring buttons and links',
          category: 'primitives',
        },
        {
          path: '/components-docs/liquid-tabs',
          title: 'Liquid Tabs',
          caption: 'Sliding indicator tabs and panels',
          category: 'primitives',
        },
        {
          path: '/components-docs/liquid-glass',
          title: 'Liquid Glass',
          caption: 'Ray-traced optical refraction material',
          category: 'primitives',
        },
        {
          path: '/components-docs/number-slot',
          title: 'Number Slot',
          caption: 'Digits that spin like a reel',
          category: 'primitives',
        },
      ],
    },
    {
      title: 'Form Controls',
      category: 'form-controls',
      links: [
        {
          path: '/components-docs/liquid-toggle',
          title: 'Liquid Toggle',
          caption: 'Interactive switch with fluid track physics',
          category: 'form-controls',
        },
        {
          path: '/components-docs/liquid-input',
          title: 'Liquid Input',
          caption: 'Tactile input, mask, and reveal field',
          category: 'form-controls',
        },
        {
          path: '/components-docs/liquid-input-group',
          title: 'Liquid Input Group',
          caption: 'Continuous multi-segment input container',
          category: 'form-controls',
        },
        {
          path: '/components-docs/liquid-slider',
          title: 'Liquid Slider',
          caption: 'Spring-driven numeric range slider',
          category: 'form-controls',
        },
        {
          path: '/components-docs/pincode-box',
          title: 'Pincode Box',
          caption: 'Multi-slot numeric OTP and PIN entry',
          category: 'form-controls',
        },
        {
          path: '/components-docs/liquid-autocomplete',
          title: 'Liquid Autocomplete',
          caption: 'Searchable select with roving focus',
          category: 'form-controls',
        },
        {
          path: '/components-docs/liquid-upload',
          title: 'Liquid Upload',
          caption: 'Drag-and-drop file and avatar dropzone',
          category: 'form-controls',
        },
      ],
    },
    {
      title: 'Overlays & Menus',
      category: 'overlays',
      links: [
        {
          path: '/components-docs/liquid-menu-popup',
          title: 'Liquid Menu Popup',
          caption: 'Trigger-anchored morphing dropdown panel',
          category: 'overlays',
        },
        {
          path: '/components-docs/liquid-morph-menu',
          title: 'Liquid Morph Menu',
          caption: 'Continuous fluid highlight navigation strip',
          category: 'overlays',
        },
        {
          path: '/components-docs/search',
          title: 'Search Palette',
          caption: 'Command palette with category filtering and hotkeys',
          category: 'overlays',
        },
        {
          path: '/components-docs/notification',
          title: 'Notification Drawer',
          caption: 'Categorized notification feed with unread tabs',
          category: 'overlays',
        },
        {
          path: '/components-docs/chatbot',
          title: 'Chatbot Assistant',
          caption: 'Conversational assistant with FAQ suggestions',
          category: 'overlays',
        },
      ],
    },
    {
      title: 'Feedback & Wizards',
      category: 'feedback',
      links: [
        {
          path: '/components-docs/liquid-toast',
          title: 'Liquid Toast',
          caption: 'Stacking spring notifications and countdowns',
          category: 'feedback',
        },
        {
          path: '/components-docs/liquid-stepper',
          title: 'Liquid Stepper',
          caption: 'Multi-step process with fluid fill',
          category: 'feedback',
        },
      ],
    },
  ];

  protected readonly totalCount = this.groups.reduce((acc, g) => acc + g.links.length, 0);

  protected readonly filteredGroups = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();

    return this.groups
      .map((group) => {
        if (!q) return group;
        const links = group.links.filter(
          (link) =>
            link.title.toLowerCase().includes(q) ||
            link.caption.toLowerCase().includes(q) ||
            link.path.toLowerCase().includes(q),
        );
        return { ...group, links };
      })
      .filter((group) => group.links.length > 0);
  });

  protected onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }
}

