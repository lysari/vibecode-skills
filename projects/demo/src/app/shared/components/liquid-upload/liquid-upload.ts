import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  ionAlertCircleOutline,
  ionAttachOutline,
  ionCheckmarkCircle,
  ionCloseCircle,
  ionCloudUploadOutline,
  ionDocumentTextOutline,
  ionImageOutline,
  ionPersonOutline,
} from '@ng-icons/ionicons';
import { LiquidButton } from '@app/shared/components/liquid-button/liquid-button';
import { IFile, ITempFile } from '@app/shared/interfaces/storage.interface';
import { MB, acceptsType, formatBytes, readImagePreview } from '@app/shared/utils/file-preview';

/**
 * `document` shows what it holds inside the field — a thumbnail, a PDF badge;
 * `photo` shows the photo itself in a round avatar beside it.
 */
export type LiquidUploadVariant = 'photo' | 'document';

export type LiquidUploadRejectionReason = 'type' | 'size' | 'dimensions' | 'read';

export interface LiquidUploadRejection {
  reason: LiquidUploadRejectionReason;
  file: File;
  message: string;
}

let uploadUid = 0;

/**
 * A single-file field, drawn like the form's other inputs: the file's name
 * inside a field of the same height, and a Browse button at its end. A file can
 * also be dropped onto it.
 *
 * ```html
 * <x-liquid-upload
 *   variant="photo"
 *   label="Passport photo"
 *   accept="image/jpeg,image/png"
 *   acceptLabel="JPG or PNG"
 *   [minWidth]="400"
 *   [minHeight]="500"
 *   [(value)]="photo"
 *   (picked)="upload($event.rawFile)"
 * >
 *   <ul>…the rules the photo has to meet…</ul>
 * </x-liquid-upload>
 * ```
 *
 * The value is an `IFile`. For an image, its `downloadUrl` is a small preview
 * drawn here — enough to show the file and to survive a saved draft being
 * reopened, and nothing more. Putting the original somewhere is the caller's
 * job: `picked` hands over the raw `File` alongside the value, the shape
 * `ITempFile` already describes.
 *
 * The file is checked against `accept`, `maxSize` and, for an image, `minWidth`
 * and `minHeight` before it is taken. One that fails leaves the value as it was,
 * says why under the field, and is reported through `rejected`.
 *
 * It is a form control too: `[formControl]`, `formControlName` and `ngModel`
 * all work, and the control is marked touched once a file is taken or removed.
 * `focus()` lands on the field's main button — the one carrying `inputId`, which
 * is what a `<label for>` or a failed validation should point at.
 *
 * Dropping a file anywhere else on the page is swallowed while one of these is
 * on it, rather than navigating away from a half-filled form.
 *
 * Tuning, read with a fallback so it can be set on any ancestor:
 * `--liquid-upload-hue` (an OKLCH hue, defaulting to `--svc-accent`) and
 * `--liquid-upload-background`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'liquidUpload',
  host: {
    class: 'liquid-upload',
    '[class.is-photo]': "variant() === 'photo'",
    '[class.is-document]': "variant() === 'document'",
    '[class.has-file]': 'value() !== null',
    '[class.is-dragging]': 'dragging()',
    '[class.is-busy]': 'busy()',
    '[class.is-invalid]': 'invalid() || rejection() !== null',
    '[class.is-disabled]': 'isDisabled()',
    '(dragenter)': 'onDragEnter($event)',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
  },
  imports: [LiquidButton, NgIcon],
  providers: [
    provideIcons({
      ionAlertCircleOutline,
      ionAttachOutline,
      ionCheckmarkCircle,
      ionCloseCircle,
      ionCloudUploadOutline,
      ionDocumentTextOutline,
      ionImageOutline,
      ionPersonOutline,
    }),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LiquidUpload),
      multi: true,
    },
  ],
  selector: 'x-liquid-upload',
  styleUrl: './liquid-upload.scss',
  templateUrl: './liquid-upload.html',
})
export class LiquidUpload implements ControlValueAccessor {
  /** The file held, or `null`. Two-way: `[(value)]`. */
  readonly value = model<IFile | null>(null);

  readonly variant = input<LiquidUploadVariant>('document');
  /** What the file is — "Passport photo", "Birth certificate". Names the buttons for a screen reader. */
  readonly label = input.required<string>();
  /** The `<input accept>` list, checked again on every file however it arrived. */
  readonly accept = input('image/jpeg,image/png,application/pdf');
  /** `accept`, worded for people. */
  readonly acceptLabel = input($localize`:@@upload.accept.document:JPG, PNG or PDF`);
  /** In bytes. */
  readonly maxSize = input(10 * MB, { transform: numberAttribute });
  /** The smallest an image may be, in pixels. Not checked for anything else. */
  readonly minWidth = input(0, { transform: numberAttribute });
  readonly minHeight = input(0, { transform: numberAttribute });

  /**
   * Whether the types and size limit are printed under the field. Off for a group
   * of fields that share them, which can say so once for all of them.
   */
  readonly hint = input(true, { transform: booleanAttribute });

  readonly inputId = input(`liquid-upload-${++uploadUid}`);
  /** Ids of anything else that describes the field, such as the form's own error. */
  readonly describedBy = input<string | null>(null);
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  /** A file was taken: the raw `File` for uploading, with the value it became. */
  readonly picked = output<ITempFile>();
  readonly rejected = output<LiquidUploadRejection>();

  private readonly picker = viewChild.required<ElementRef<HTMLInputElement>>('picker');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly dragging = signal(false);
  protected readonly busy = signal(false);
  protected readonly rejection = signal<string | null>(null);
  /** A preview that failed to load — a blob URL from an older draft, say. */
  private readonly brokenUrl = signal<string | null>(null);
  /** Set by a form through `setDisabledState`, alongside the `disabled` input. */
  private readonly formDisabled = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly valueId = computed(() => `${this.inputId()}-value`);
  protected readonly hintId = computed(() => `${this.inputId()}-hint`);
  protected readonly errorId = computed(() => `${this.inputId()}-error`);
  protected readonly describedByIds = computed(() =>
    [
      this.valueId(),
      this.hint() ? this.hintId() : null,
      this.rejection() !== null ? this.errorId() : null,
      this.describedBy(),
    ]
      .filter(Boolean)
      .join(' '),
  );

  /** What the field takes, under it: types, size, and the smallest image. */
  protected readonly limitLabel = computed(() => {
    const types = this.acceptLabel();
    const max = formatBytes(this.maxSize());
    const parts = [$localize`:@@upload.limit:${types}:TYPES: · up to ${max}:MAX:`];
    const width = this.minWidth();
    const height = this.minHeight();
    if (width || height) {
      parts.push(
        $localize`:@@upload.limit.dimensions:at least ${width}:WIDTH: × ${height}:HEIGHT: px`,
      );
    }
    return parts.join(' · ');
  });

  protected readonly placeholder = computed(() =>
    this.variant() === 'photo'
      ? $localize`:@@upload.empty.photo:No photo chosen`
      : $localize`:@@upload.empty:No file chosen`,
  );

  protected readonly actionLabel = computed(() =>
    this.value() ? $localize`:@@upload.replace:Replace` : $localize`:@@upload.browse:Browse`,
  );

  protected readonly kind = computed<'image' | 'pdf' | 'file' | null>(() => {
    const file = this.value();
    if (!file) return null;
    const type = (file.type || file.fileType || '').toLowerCase();
    if (type.startsWith('image/')) return 'image';
    if (type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
    return 'file';
  });

  protected readonly preview = computed(() => {
    const url = this.value()?.downloadUrl || this.value()?.downloadURL || '';
    return this.kind() === 'image' && url && url !== this.brokenUrl() ? url : null;
  });

  /** Size, and an image's pixels, beside the file's name. */
  protected readonly meta = computed(() => {
    const file = this.value();
    if (!file) return '';
    const parts = [file.fileSize ? formatBytes(file.fileSize) : ''];
    // `ratio` carries the original's pixel size, written as `width:height`.
    const [width, height] = (file.ratio ?? '').split(':').map(Number);
    if (width && height) parts.push(`${width} × ${height}`);
    return parts.filter(Boolean).join(' · ');
  });

  /** Nested elements fire their own enter and leave; only the outermost pair counts. */
  private dragDepth = 0;
  /** Bumped per file, so a slow decode cannot overwrite a file chosen after it. */
  private attempt = 0;

  // Handed over by a form; no-ops until one registers.
  private onChange: (value: IFile | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // A file dropped beside the field would otherwise replace the whole page with
    // it. Only when nothing nearer took the drop: a field's own handler has
    // already called `preventDefault` by the time the event bubbles up here.
    const document = inject(DOCUMENT);
    const swallow = (event: DragEvent) => {
      if (!hasFiles(event) || event.defaultPrevented) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
    };
    document.addEventListener('dragover', swallow);
    document.addEventListener('drop', swallow);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('dragover', swallow);
      document.removeEventListener('drop', swallow);
    });
  }

  focus(options?: FocusOptions): void {
    this.host.querySelector<HTMLElement>(`[id="${this.inputId()}"]`)?.focus(options);
  }

  /** Opens the system picker. */
  pick(): void {
    if (this.isDisabled() || this.busy()) return;
    const input = this.picker().nativeElement;
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // Fallback to click() below
      }
    }
    input.click();
  }

  remove(): void {
    this.rejection.set(null);
    this.commit(null);
    // The clear button that was clicked is gone; Browse takes the focus instead.
    queueMicrotask(() => this.focus());
  }

  /** Checks a file and takes it — what a pick and a drop both end in. */
  async addFile(file: File): Promise<void> {
    const attempt = ++this.attempt;
    this.rejection.set(null);

    if (!acceptsType(file, this.accept())) {
      this.reject(
        file,
        'type',
        $localize`:@@upload.error.type:This file type isn't accepted. Use ${this.acceptLabel()}:TYPES:.`,
      );
      return;
    }
    if (file.size > this.maxSize()) {
      const max = formatBytes(this.maxSize());
      this.reject(
        file,
        'size',
        $localize`:@@upload.error.size:This file is too large. The limit is ${max}:MAX:.`,
      );
      return;
    }

    let preview = '';
    let ratio: string | undefined;
    if (file.type.toLowerCase().startsWith('image/')) {
      this.busy.set(true);
      try {
        const image = await readImagePreview(file);
        if (attempt !== this.attempt) return;
        if (image.width < this.minWidth() || image.height < this.minHeight()) {
          const width = this.minWidth();
          const height = this.minHeight();
          this.reject(
            file,
            'dimensions',
            $localize`:@@upload.error.dimensions:This image is too small. Use one at least ${width}:WIDTH: × ${height}:HEIGHT: pixels.`,
          );
          return;
        }
        preview = image.url;
        ratio = `${image.width}:${image.height}`;
      } catch {
        if (attempt === this.attempt) {
          this.reject(
            file,
            'read',
            $localize`:@@upload.error.read:This file couldn't be opened. Try another one.`,
          );
        }
        return;
      } finally {
        if (attempt === this.attempt) this.busy.set(false);
      }
    }

    const stored: IFile = {
      downloadUrl: preview,
      fileSize: file.size,
      fileType: file.type,
      filename: file.name,
      key: `${Date.now()}-${file.name}`,
      name: file.name,
      type: file.type,
      ...(ratio ? { ratio } : {}),
    };
    this.commit(stored);
    this.picked.emit({
      name: file.name,
      size: file.size,
      type: file.type,
      file: stored,
      rawFile: file,
    });
  }

  protected onPicked(input: HTMLInputElement): void {
    const file = input.files?.[0];
    // Cleared, so choosing the same file again after a remove still fires `change`.
    input.value = '';
    if (file) void this.addFile(file);
  }

  /** The field is one big target for the pointer; its own buttons still do their own thing. */
  protected onFieldClick(event: MouseEvent): void {
    if ((event.target as Element | null)?.closest('button')) return;
    this.pick();
  }

  protected onPreviewError(url: string): void {
    this.brokenUrl.set(url);
  }

  protected onDragEnter(event: DragEvent): void {
    if (!hasFiles(event) || this.isDisabled()) return;
    event.preventDefault();
    this.dragDepth++;
    this.dragging.set(true);
  }

  protected onDragOver(event: DragEvent): void {
    if (!hasFiles(event) || this.isDisabled()) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  protected onDragLeave(event: DragEvent): void {
    if (!hasFiles(event) || this.isDisabled()) return;
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    if (!hasFiles(event) || this.isDisabled()) return;
    event.preventDefault();
    this.dragDepth = 0;
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) void this.addFile(file);
  }

  private reject(file: File, reason: LiquidUploadRejectionReason, message: string): void {
    this.rejection.set(message);
    this.rejected.emit({ reason, file, message });
  }

  private commit(value: IFile | null): void {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }

  // ── ControlValueAccessor ───────────────────────────────────────────────────

  writeValue(value: IFile | null | undefined): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: IFile | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}

/** Dragging text or a link over the field is not an upload. */
function hasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}
