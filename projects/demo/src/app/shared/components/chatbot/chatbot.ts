import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { LiquidButton } from '@app/shared/components/liquid-button/liquid-button';
import { LiquidMenuHeaderIcon } from '@app/shared/components/liquid-menu-popup/liquid-menu-header-icon.directive';
import { LiquidMenuPopup } from '@app/shared/components/liquid-menu-popup/liquid-menu-popup';
import { CHATBOT_STOP_WORDS } from '@app/shared/constants/chatbot';
import { FAQ_ITEMS } from '@app/shared/constants/faq';
import { IFaqItem } from '@app/shared/interfaces/faq.interface';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ionArrowUp, ionChatbubbleEllipsesOutline, ionSparkles } from '@ng-icons/ionicons';

interface ChatMessage {
  id: number;
  from: 'bot' | 'user';
  text: string;
}

/** Long enough for the typing dots to read as a reply being written, short enough not to wait on. */
const REPLY_DELAY = 700;

/** Words too short to tell one question from another ("is", "do", "my"). */
const MIN_WORD_LENGTH = 3;

/**
 * The help assistant, made to sit inside an `<x-liquid-menu-popup>`:
 *
 * ```html
 * <x-liquid-menu-popup #chatMenu="liquidMenu" role="dialog" title="Assistant">
 *   <app-chatbot />
 * </x-liquid-menu-popup>
 * ```
 *
 * Projected straight into the popup rather than through `liquidMenuContent`,
 * so the conversation outlives a close and is still there on the next open.
 * It brings its own title icon.
 *
 * It answers from the home page's FAQ: a suggested question gets its own
 * answer, and typed text gets the FAQ whose words it shares most, or a pointer
 * to a registration office when nothing matches. `replyTo` is the one place a
 * real assistant service would plug in.
 */
@Component({
  imports: [NgIcon, LiquidButton, LiquidMenuHeaderIcon],
  providers: [provideIcons({ ionArrowUp, ionChatbubbleEllipsesOutline, ionSparkles })],
  selector: 'app-chatbot',
  styleUrl: './chatbot.scss',
  templateUrl: './chatbot.html',
})
export class Chatbot {
  private readonly injector = inject(Injector);
  private readonly menu = inject(LiquidMenuPopup, { optional: true });
  private readonly log = viewChild.required<ElementRef<HTMLElement>>('log');

  private nextId = 0;
  private replyTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly messages = signal<ChatMessage[]>([
    {
      id: this.nextId++,
      from: 'bot',
      text: $localize`:@@chatbot.greeting:Hi! I can help with signing in, the app, fees and your account. What would you like to know?`,
    },
  ]);
  protected readonly draft = signal('');
  protected readonly isTyping = signal(false);
  private readonly asked = signal<ReadonlySet<string>>(new Set());
  /** Reattaching restarts CSS animations, so only messages added since the open arrive. */
  protected readonly arrivedBefore = signal(0);

  /** The FAQ questions not asked yet, offered as one-tap prompts. */
  protected readonly suggestions = computed(() =>
    FAQ_ITEMS.filter((faq) => !this.asked().has(faq.key)),
  );

  protected readonly canSend = computed(() => !!this.draft().trim() && !this.isTyping());

  constructor() {
    // The popup detaches its content on close, which drops the log's scroll
    // position, so each open lands back on the latest message.
    effect(() => {
      if (!this.menu?.isOpen()) return;
      this.arrivedBefore.set(this.nextId);
      this.scrollToEnd('instant');
    });

    inject(DestroyRef).onDestroy(() => {
      if (this.replyTimer !== null) clearTimeout(this.replyTimer);
    });
  }

  protected send(): void {
    if (!this.canSend()) return;
    const text = this.draft().trim();
    this.draft.set('');
    this.ask(text, matchFaq(text));
  }

  protected pick(faq: IFaqItem): void {
    if (this.isTyping()) return;
    this.ask(faq.question, faq);
  }

  private ask(text: string, faq: IFaqItem | null): void {
    this.push('user', text);
    this.isTyping.set(true);
    if (faq) this.asked.update((keys) => new Set(keys).add(faq.key));

    this.replyTimer = setTimeout(() => {
      this.replyTimer = null;
      this.isTyping.set(false);
      this.push('bot', replyTo(faq));
    }, REPLY_DELAY);
  }

  private push(from: ChatMessage['from'], text: string): void {
    this.messages.update((list) => [...list, { id: this.nextId++, from, text }]);
    this.scrollToEnd('smooth');
  }

  private scrollToEnd(behavior: ScrollBehavior): void {
    afterNextRender(
      () => {
        const log = this.log().nativeElement;
        log.scrollTo({ top: log.scrollHeight, behavior });
      },
      { injector: this.injector },
    );
  }
}

function replyTo(faq: IFaqItem | null): string {
  return (
    faq?.answer ??
    $localize`:@@chatbot.fallback:I'm not sure about that one yet. Try one of the suggested questions below, or ask at any registration office with your identity card.`
  );
}

/**
 * Scores each FAQ by the words the text shares with it, the question counting
 * double. Khmer is written without spaces, so a whole Khmer phrase is one
 * "word" and only matches when the question contains it.
 */
function matchFaq(text: string): IFaqItem | null {
  const words = text
    .toLocaleLowerCase()
    .split(/[\s\p{P}]+/u)
    .filter((word) => word.length >= MIN_WORD_LENGTH && !CHATBOT_STOP_WORDS.has(word));

  let best: IFaqItem | null = null;
  let bestScore = 0;
  for (const faq of FAQ_ITEMS) {
    const question = faq.question.toLocaleLowerCase();
    const answer = faq.answer.toLocaleLowerCase();
    const score = words.reduce(
      (sum, word) => sum + (question.includes(word) ? 2 : 0) + (answer.includes(word) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      best = faq;
      bestScore = score;
    }
  }
  return best;
}
