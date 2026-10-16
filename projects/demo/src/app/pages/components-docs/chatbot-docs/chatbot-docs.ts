import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Chatbot } from '@app/shared/components/chatbot/chatbot';
import { LiquidButton } from '@app/shared/components/liquid-button/liquid-button';
import { LiquidMenuPopup } from '@app/shared/components/liquid-menu-popup/liquid-menu-popup';
import { LiquidMenuTrigger } from '@app/shared/components/liquid-menu-popup/liquid-menu-trigger.directive';

interface Section {
  id: string;
  title: string;
}

interface ApiRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Chatbot,
    LiquidButton,
    LiquidMenuPopup,
    LiquidMenuTrigger,
  ],
  selector: 'app-chatbot-docs',
  styleUrls: ['../shared/docs-shared.scss', './chatbot-docs.scss'],
  templateUrl: './chatbot-docs.html',
})
export class ChatbotDocs {
  private readonly document = inject(DOCUMENT);

  protected readonly containerWidth = signal(400);
  protected readonly containerHeight = signal(480);

  protected readonly sections: Section[] = [
    { id: 'overview', title: 'Overview' },
    { id: 'playground', title: 'Playground' },
    { id: 'sizes', title: 'Sizes & Popups' },
    { id: 'setup', title: 'Setup' },
    { id: 'api', title: 'API' },
  ];

  protected readonly apiRows: ApiRow[] = [
    {
      name: 'messages',
      type: 'Signal<ChatMessage[]>',
      default: 'initial greeting',
      description: 'Reactive signal maintaining the chronological conversation message stack.',
    },
    {
      name: 'isTyping',
      type: 'Signal<boolean>',
      default: 'false',
      description: 'Indicates whether the simulated AI assistant is currently preparing a response.',
    },
    {
      name: 'suggestions',
      type: 'Signal<IFaqItem[]>',
      default: 'FAQ items',
      description: 'Quick-reply question chips offered to the user.',
    },
    {
      name: 'send()',
      type: '() => void',
      default: 'method',
      description: 'Submits user drafted query and schedules simulated bot reply.',
    },
    {
      name: 'pick(faq)',
      type: '(faq: IFaqItem) => void',
      default: 'method',
      description: 'Submits selected quick-answer suggestion directly.',
    },
    {
      name: 'clearHistory()',
      type: '() => void',
      default: 'method',
      description: 'Resets the conversation history back to the initial greeting.',
    },
  ];

  protected readonly playMarkup = computed(() => {
    return [
      `<x-liquid-menu-popup #botMenu="liquidMenu" role="dialog" title="AI Assistant">`,
      `  <app-chatbot />`,
      `</x-liquid-menu-popup>`,
      ``,
      `<button`,
      `  type="button"`,
      `  liquidButton="filled"`,
      `  [liquidMenuTriggerFor]="botMenu"`,
      `>`,
      `  Ask Assistant`,
      `</button>`,
    ].join('\n');
  });

  protected jumpTo(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  protected scrollTo(id: string): void {
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  protected setWidth(val: number): void {
    this.containerWidth.set(val);
  }

  protected setHeight(val: number): void {
    this.containerHeight.set(val);
  }
}
