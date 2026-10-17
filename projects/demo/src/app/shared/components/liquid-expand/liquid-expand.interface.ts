/**
 * An item displayed in a `<x-liquid-accordion>`.
 *
 * Compatible with `IFaqItem` (`question` / `answer`) as well as standard
 * accordion items (`title` / `content`).
 */
export interface LiquidAccordionItem {
  key: string;
  title?: string;
  question?: string;
  content?: string;
  answer?: string;
  icon?: string;
  disabled?: boolean;
}

