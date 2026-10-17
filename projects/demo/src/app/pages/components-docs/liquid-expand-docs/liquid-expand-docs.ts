import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  LiquidAccordion,
  LiquidExpand,
} from '@app/shared/components/liquid-expand';
import { FAQ_ITEMS } from '@app/shared/constants/faq';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  ionChatbubbleEllipsesOutline,
  ionChevronDownOutline,
  ionHelpCircleOutline,
  ionIdCard,
  ionKey,
  ionKeypad,
  ionLanguage,
  ionLockClosed,
  ionPhonePortrait,
  ionQrCode,
  ionWallet,
} from '@ng-icons/ionicons';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LiquidAccordion, LiquidExpand, NgIcon],
  providers: [
    provideIcons({
      ionChatbubbleEllipsesOutline,
      ionChevronDownOutline,
      ionHelpCircleOutline,
      ionIdCard,
      ionKey,
      ionKeypad,
      ionLanguage,
      ionLockClosed,
      ionPhonePortrait,
      ionQrCode,
      ionWallet,
    }),
  ],
  selector: 'app-liquid-expand-docs',
  styleUrls: ['../liquid-input-docs/liquid-input-docs.scss', './liquid-expand-docs.scss'],
  templateUrl: './liquid-expand-docs.html',
})
export class LiquidExpandDocs {
  protected readonly faqs = FAQ_ITEMS;

  protected readonly activeFaq = signal<string | null>('what-is');
  protected readonly activePortalFaq = signal<string | null>('what-is');
  protected readonly standaloneOpen = signal(false);
  protected readonly multiOpenKeys = signal<string[]>(['cost', 'language']);
}

